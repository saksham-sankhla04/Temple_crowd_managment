const Temple = require("../models/Temple");
const festivals = require("../data/festivals");
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "";

const getLabel = (value) => {
  if (value < 40) return "Low";
  if (value <= 65) return "Moderate";
  if (value <= 85) return "High";
  return "Critical";
};

const getHourMultiplier = (hour) => {
  if (hour >= 4 && hour <= 8) return 0.6;
  if (hour >= 9 && hour <= 12) return 1.0;
  if (hour >= 13 && hour <= 15) return 0.7;
  if (hour >= 16 && hour <= 19) return 0.9;
  return 0.3;
};

const getRecommendation = (score, festivalName) => {
  if (score > 85) {
    return festivalName
      ? `Critical crowd expected due to ${festivalName}. Use strict crowd-control and staggered entry plans.`
      : "Critical crowd expected. Activate full crowd-control protocol and queue zoning.";
  }
  if (score >= 65) {
    return "High crowd expected. Increase staff at gates and keep queue announcements frequent.";
  }
  if (score >= 40) {
    return "Moderate crowd expected. Normal operations with active monitoring are sufficient.";
  }
  return "Low crowd expected. Maintain standard staffing and routine monitoring.";
};

const getFestivalContext = (templeName, dateInput, dateObj) => {
  const eventsOnDate = festivals.filter((event) => event.date === dateInput).map((event) => event.name);
  const hasFestival = eventsOnDate.length > 0;
  const festivalName = hasFestival ? [...new Set(eventsOnDate)].join(", ") : null;
  const normalizedFestival = (festivalName || "").toLowerCase();
  const normalizedTemple = templeName.toLowerCase();

  const day = dateObj.getDay();
  const month = dateObj.getMonth();

  const isSundayOrMonday = day === 0 || day === 1;
  const isSaturday = day === 6;
  const isOctNov = month === 9 || month === 10;
  const isSomnathShivratri = normalizedTemple.includes("somnath") && normalizedFestival.includes("shivratri");
  const isAmbajiNavratri = normalizedTemple.includes("ambaji") && normalizedFestival.includes("navratri");
  const isDwarkaJanmashtami =
    (normalizedTemple.includes("dwarka") || normalizedTemple.includes("dwarkadhish")) &&
    normalizedFestival.includes("janmashtami");

  return {
    festivalName,
    hasFestival,
    day,
    month,
    isSundayOrMonday,
    isSaturday,
    isOctNov,
    isSomnathShivratri,
    isAmbajiNavratri,
    isDwarkaJanmashtami,
  };
};

const computeRuleScore = (context) => {
  let score = 40;
  if (context.hasFestival) score += 30;
  if (context.isSundayOrMonday) score += 15;
  if (context.isSaturday) score += 10;
  if (context.isOctNov) score += 10;
  if (context.isSomnathShivratri) score += 20;
  if (context.isAmbajiNavratri) score += 20;
  if (context.isDwarkaJanmashtami) score += 20;
  return Math.min(100, Math.max(20, score));
};

const getTempleCode = (templeName) => {
  const value = templeName.toLowerCase();
  if (value.includes("somnath")) return 0;
  if (value.includes("dwarka") || value.includes("dwarkadhish")) return 1;
  if (value.includes("ambaji")) return 2;
  if (value.includes("pavagadh") || value.includes("kalikamata")) return 3;
  return 4;
};

const getMlScore = async (temple, context, ruleScore) => {
  if (!ML_SERVICE_URL) {
    return { score: null, source: "rule-fallback", model: "festival-weighted-rule-engine-v1" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1600);

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        temple_code: getTempleCode(temple.name),
        day_of_week: context.day,
        month: context.month + 1,
        is_festival: context.hasFestival ? 1 : 0,
        is_sunday_monday: context.isSundayOrMonday ? 1 : 0,
        is_saturday: context.isSaturday ? 1 : 0,
        is_oct_nov: context.isOctNov ? 1 : 0,
        is_somnath_shivratri: context.isSomnathShivratri ? 1 : 0,
        is_ambaji_navratri: context.isAmbajiNavratri ? 1 : 0,
        is_dwarka_janmashtami: context.isDwarkaJanmashtami ? 1 : 0,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { score: null, source: "rule-fallback", model: "festival-weighted-rule-engine-v1" };
    }

    const data = await response.json();
    const mlScore = Number(data?.crowd_score);
    if (Number.isNaN(mlScore)) {
      return { score: null, source: "rule-fallback", model: "festival-weighted-rule-engine-v1" };
    }

    const finalScore = Math.min(100, Math.max(20, Math.round(mlScore)));
    return {
      score: finalScore,
      source: "ml",
      model: data?.model_version || "random-forest-v1",
      baselineRuleScore: ruleScore,
    };
  } catch (error) {
    return { score: null, source: "rule-fallback", model: "festival-weighted-rule-engine-v1" };
  }
};

const getPrediction = async (req, res, next) => {
  try {
    const temple = await Temple.findById(req.params.templeId);
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    const dateInput = req.query.date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const dateObj = new Date(`${dateInput}T00:00:00`);
    if (Number.isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Invalid date value" });
    }

    const context = getFestivalContext(temple.name, dateInput, dateObj);
    const ruleScore = computeRuleScore(context);
    const mlResult = await getMlScore(temple, context, ruleScore);
    const crowdScore = mlResult.score ?? ruleScore;

    const hourlyBreakdown = Array.from({ length: 24 }).map((_, hour) => {
      const multiplier = getHourMultiplier(hour);
      const hourScore = Math.round(crowdScore * multiplier);
      const timestamp = new Date(`${dateInput}T00:00:00`);
      timestamp.setHours(hour, 0, 0, 0);
      return {
        hour: `${String(hour).padStart(2, "0")}:00`,
        timestamp: timestamp.toISOString(),
        crowdScore: hourScore,
        label: getLabel(hourScore),
        predictedCrowd: Math.round((temple.totalCapacity * hourScore) / 100),
      };
    });

    const peakRecord = hourlyBreakdown.reduce((max, item) =>
      item.crowdScore > max.crowdScore ? item : max
    );

    return res.status(200).json({
      temple: {
        id: temple._id,
        name: temple.name,
        location: temple.location,
      },
      date: dateInput,
      crowdScore,
      festivalName: context.festivalName,
      peakHour: peakRecord.hour,
      recommendation: getRecommendation(crowdScore, context.festivalName),
      hourlyBreakdown,
      forecast: hourlyBreakdown,
      model: mlResult.model,
      predictionSource: mlResult.source,
      baselineRuleScore: mlResult.baselineRuleScore ?? ruleScore,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getPrediction };
