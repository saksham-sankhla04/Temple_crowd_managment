const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const Pass = require("../models/Pass");
const Temple = require("../models/Temple");
const Queue = require("../models/Queue");

const bookPass = async (req, res, next) => {
  try {
    const { templeId, pilgrimName, phone, numPilgrims, darshanSlot, visitDate } = req.body;

    if (!templeId || !pilgrimName || !phone || !numPilgrims || !darshanSlot || !visitDate) {
      return res
        .status(400)
        .json({ message: "templeId, pilgrimName, phone, numPilgrims, darshanSlot and visitDate are required" });
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    const slot = temple.darshanTimings.find((item) => item.slot === darshanSlot);
    if (!slot) {
      return res.status(400).json({ message: "Invalid darshan slot for this temple" });
    }

    if (slot.bookedCount + Number(numPilgrims) > slot.maxPilgrims) {
      return res.status(400).json({ message: "Darshan slot capacity exceeded" });
    }

    const passCode = `PASS-${uuidv4().split("-")[0].toUpperCase()}`;
    const qrPayload = JSON.stringify({
      passCode,
      templeId,
      pilgrimName,
      numPilgrims,
      darshanSlot,
      visitDate,
    });
    const qrData = await QRCode.toDataURL(qrPayload);

    const pass = await Pass.create({
      userId: req.user._id,
      phone,
      passCode,
      templeId,
      pilgrimName,
      numPilgrims,
      darshanSlot,
      visitDate,
      qrData,
      status: "booked",
    });

    const latestToken = await Queue.findOne({ templeId, darshanSlot }).sort({ tokenNumber: -1 });
    const tokenNumber = latestToken ? latestToken.tokenNumber + 1 : 1;
    const waitingAhead = await Queue.countDocuments({ templeId, darshanSlot, status: "waiting" });

    const queueEntry = await Queue.create({
      templeId,
      pilgrimName,
      phone,
      tokenNumber,
      darshanSlot,
      estimatedWaitMinutes: waitingAhead * 3,
      status: "waiting",
    });

    pass.queueEntryId = queueEntry._id;
    pass.tokenNumber = tokenNumber;
    await pass.save();

    slot.bookedCount += Number(numPilgrims);
    await temple.save();

    return res.status(201).json({
      message: "Darshan pass booked and queue token assigned",
      pass,
      queue: {
        queueEntryId: queueEntry._id,
        tokenNumber,
        queuePosition: waitingAhead + 1,
        estimatedWaitMinutes: queueEntry.estimatedWaitMinutes,
        status: queueEntry.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPass = async (req, res, next) => {
  try {
    const pass = await Pass.findOne({ passCode: req.params.passCode }).populate("templeId", "name location");
    if (!pass) {
      return res.status(404).json({ valid: false, message: "Pass not found" });
    }

    const isUsed = pass.status === "used";
    return res.status(200).json({
      valid: !isUsed,
      message: isUsed ? "Pass already used" : "Pass is valid",
      pass,
    });
  } catch (error) {
    return next(error);
  }
};

const markPassUsed = async (req, res, next) => {
  try {
    const pass = await Pass.findOne({ passCode: req.params.passCode });
    if (!pass) {
      return res.status(404).json({ message: "Pass not found" });
    }
    if (pass.status === "used") {
      return res.status(400).json({ message: "Pass already marked as used" });
    }

    pass.status = "used";
    await pass.save();

    return res.status(200).json({ message: "Pass marked as used", pass });
  } catch (error) {
    return next(error);
  }
};

const getMyPasses = async (req, res, next) => {
  try {
    const passes = await Pass.find({
      $or: [{ userId: req.user._id }, { pilgrimName: req.user.name }],
    })
      .populate("templeId", "name location")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedPasses = await Promise.all(
      passes.map(async (pass) => {
        if (!pass.queueEntryId) {
          return { ...pass, queue: null };
        }

        const queueEntry = await Queue.findById(pass.queueEntryId).lean();
        if (!queueEntry) {
          return { ...pass, queue: null };
        }

        const peopleAhead = await Queue.countDocuments({
          templeId: queueEntry.templeId,
          darshanSlot: queueEntry.darshanSlot,
          tokenNumber: { $lt: queueEntry.tokenNumber },
          status: "waiting",
        });

        return {
          ...pass,
          queue: {
            queueEntryId: queueEntry._id,
            tokenNumber: queueEntry.tokenNumber,
            status: queueEntry.status,
            estimatedWaitMinutes: queueEntry.estimatedWaitMinutes,
            queuePosition: peopleAhead + 1,
            darshanSlot: queueEntry.darshanSlot,
          },
        };
      })
    );

    return res.status(200).json({ passes: enrichedPasses });
  } catch (error) {
    return next(error);
  }
};

module.exports = { bookPass, verifyPass, markPassUsed, getMyPasses };
