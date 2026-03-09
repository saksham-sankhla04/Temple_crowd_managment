const Queue = require("../models/Queue");
const Temple = require("../models/Temple");
const Pass = require("../models/Pass");

const joinQueue = async (req, res, next) => {
  try {
    const { templeId, pilgrimName, phone, darshanSlot } = req.body;

    if (!templeId || !pilgrimName || !phone || !darshanSlot) {
      return res.status(400).json({ message: "templeId, pilgrimName, phone and darshanSlot are required" });
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    const slotExists = temple.darshanTimings.some((slot) => slot.slot === darshanSlot);
    if (!slotExists) {
      return res.status(400).json({ message: "Invalid darshan slot for this temple" });
    }

    const latestToken = await Queue.findOne({ templeId, darshanSlot }).sort({ tokenNumber: -1 });
    const tokenNumber = latestToken ? latestToken.tokenNumber + 1 : 1;

    const waitingAhead = await Queue.countDocuments({
      templeId,
      darshanSlot,
      status: "waiting",
    });

    const queueEntry = await Queue.create({
      templeId,
      pilgrimName,
      phone,
      tokenNumber,
      darshanSlot,
      estimatedWaitMinutes: waitingAhead * 3,
    });

    return res.status(201).json({ message: "Joined queue", queueEntry });
  } catch (error) {
    return next(error);
  }
};

const getQueueStatus = async (req, res, next) => {
  try {
    const queueEntry = await Queue.findById(req.params.id).populate("templeId", "name location");
    if (!queueEntry) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    const peopleAhead = await Queue.countDocuments({
      templeId: queueEntry.templeId._id,
      darshanSlot: queueEntry.darshanSlot,
      tokenNumber: { $lt: queueEntry.tokenNumber },
      status: "waiting",
    });

    return res.status(200).json({
      queueEntry,
      queuePosition: peopleAhead + 1,
    });
  } catch (error) {
    return next(error);
  }
};

const getQueueStatusByToken = async (req, res, next) => {
  try {
    const { templeId, darshanSlot, tokenNumber } = req.query;
    if (!templeId || !darshanSlot || !tokenNumber) {
      return res.status(400).json({ message: "templeId, darshanSlot and tokenNumber are required" });
    }

    const queueEntry = await Queue.findOne({
      templeId,
      darshanSlot,
      tokenNumber: Number(tokenNumber),
    }).populate("templeId", "name location");

    if (!queueEntry) {
      return res.status(404).json({ message: "Queue entry not found for provided token" });
    }

    const peopleAhead = await Queue.countDocuments({
      templeId,
      darshanSlot,
      tokenNumber: { $lt: Number(tokenNumber) },
      status: "waiting",
    });

    return res.status(200).json({
      queueEntry,
      queuePosition: peopleAhead + 1,
      estimatedWaitMinutes: peopleAhead * 3,
    });
  } catch (error) {
    return next(error);
  }
};

const updateQueueStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["waiting", "called", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const queueEntry = await Queue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!queueEntry) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    if (status === "completed") {
      await Pass.findOneAndUpdate(
        { queueEntryId: queueEntry._id, status: { $ne: "cancelled" } },
        { status: "used" }
      );
    }

    return res.status(200).json({ message: "Queue status updated", queueEntry });
  } catch (error) {
    return next(error);
  }
};

const getLiveStats = async (req, res, next) => {
  try {
    const { templeId, darshanSlot } = req.query;
    const filter = {};
    if (templeId) {
      filter.templeId = templeId;
    }
    if (darshanSlot) {
      filter.darshanSlot = darshanSlot;
    }

    const [waiting, called, completed, cancelled] = await Promise.all([
      Queue.countDocuments({ ...filter, status: "waiting" }),
      Queue.countDocuments({ ...filter, status: "called" }),
      Queue.countDocuments({ ...filter, status: "completed" }),
      Queue.countDocuments({ ...filter, status: "cancelled" }),
    ]);

    return res.status(200).json({
      stats: {
        waiting,
        called,
        completed,
        cancelled,
        total: waiting + called + completed + cancelled,
      },
      filter,
    });
  } catch (error) {
    return next(error);
  }
};

const callNextToken = async (req, res, next) => {
  try {
    const { templeId, darshanSlot } = req.body;
    if (!templeId) {
      return res.status(400).json({ message: "templeId is required" });
    }

    const filter = { templeId, status: "waiting" };
    if (darshanSlot) {
      filter.darshanSlot = darshanSlot;
    }

    const nextEntry = await Queue.findOne(filter).sort({ createdAt: 1, tokenNumber: 1 });
    if (!nextEntry) {
      return res.status(404).json({ message: "No waiting tokens available" });
    }

    nextEntry.status = "called";
    await nextEntry.save();

    return res.status(200).json({ message: "Next token called", queueEntry: nextEntry });
  } catch (error) {
    return next(error);
  }
};

const markCalledAsCompleted = async (req, res, next) => {
  try {
    const { templeId, darshanSlot } = req.body;
    if (!templeId) {
      return res.status(400).json({ message: "templeId is required" });
    }

    const filter = { templeId, status: "called" };
    if (darshanSlot) {
      filter.darshanSlot = darshanSlot;
    }

    const calledEntry = await Queue.findOne(filter).sort({ updatedAt: 1, tokenNumber: 1 });
    if (!calledEntry) {
      return res.status(404).json({ message: "No called tokens available to mark completed" });
    }

    calledEntry.status = "completed";
    await calledEntry.save();

    await Pass.findOneAndUpdate(
      { queueEntryId: calledEntry._id, status: { $ne: "cancelled" } },
      { status: "used" }
    );

    return res.status(200).json({ message: "Called token marked completed", queueEntry: calledEntry });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  joinQueue,
  getQueueStatus,
  getQueueStatusByToken,
  updateQueueStatus,
  getLiveStats,
  callNextToken,
  markCalledAsCompleted,
};
