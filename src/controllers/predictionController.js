const Temple = require("../models/Temple");
const festivals = require("../data/festivals");

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

    const eventsOnDate = festivals.filter((event) => event.date === dateInput).map((event) => event.name);
    const hasFestival = eventsOnDate.length > 0;
    const festivalName = hasFestival ? [...new Set(eventsOnDate)].join(", ") : null;
    const normalizedFestival = (festivalName || "").toLowerCase();
    const templeName = temple.name.toLowerCase();

    let crowdScore = 40;
    if (hasFestival) crowdScore += 30;

    const day = dateObj.getDay();
    if (day === 0 || day === 1) crowdScore += 15;
    if (day === 6) crowdScore += 10;

    const month = dateObj.getMonth();
    if (month === 9 || month === 10) crowdScore += 10;

    if (templeName.includes("somnath") && normalizedFestival.includes("shivratri")) crowdScore += 20;
    if (templeName.includes("ambaji") && normalizedFestival.includes("navratri")) crowdScore += 20;
    if (
      (templeName.includes("dwarka") || templeName.includes("dwarkadhish")) &&
      normalizedFestival.includes("janmashtami")
    ) {
      crowdScore += 20;
    }

    crowdScore = Math.min(100, Math.max(20, crowdScore));

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
      festivalName,
      peakHour: peakRecord.hour,
      recommendation: getRecommendation(crowdScore, festivalName),
      hourlyBreakdown,
      forecast: hourlyBreakdown,
      model: "festival-weighted-rule-engine-v1",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getPrediction };
