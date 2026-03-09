const Temple = require("../models/Temple");

const defaultTemples = [
  {
    name: "Somnath Temple",
    location: "Gir Somnath, Gujarat",
    totalCapacity: 10000,
    currentOccupancy: 0,
    darshanTimings: [
      { slot: "05:30-07:00", maxPilgrims: 1200, bookedCount: 0 },
      { slot: "07:00-09:00", maxPilgrims: 1800, bookedCount: 0 },
      { slot: "09:00-11:00", maxPilgrims: 1800, bookedCount: 0 },
      { slot: "11:00-13:00", maxPilgrims: 1500, bookedCount: 0 },
      { slot: "16:00-18:00", maxPilgrims: 1900, bookedCount: 0 },
      { slot: "18:00-20:00", maxPilgrims: 1800, bookedCount: 0 },
    ],
  },
  {
    name: "Dwarkadhish Temple",
    location: "Dwarka, Gujarat",
    totalCapacity: 8000,
    currentOccupancy: 0,
    darshanTimings: [
      { slot: "06:00-08:00", maxPilgrims: 1300, bookedCount: 0 },
      { slot: "08:00-10:00", maxPilgrims: 1500, bookedCount: 0 },
      { slot: "10:00-12:00", maxPilgrims: 1400, bookedCount: 0 },
      { slot: "16:00-18:00", maxPilgrims: 1900, bookedCount: 0 },
      { slot: "18:00-20:00", maxPilgrims: 1900, bookedCount: 0 },
    ],
  },
  {
    name: "Ambaji Temple",
    location: "Banaskantha, Gujarat",
    totalCapacity: 12000,
    currentOccupancy: 0,
    darshanTimings: [
      { slot: "05:00-07:00", maxPilgrims: 1800, bookedCount: 0 },
      { slot: "07:00-09:00", maxPilgrims: 2200, bookedCount: 0 },
      { slot: "09:00-11:00", maxPilgrims: 2200, bookedCount: 0 },
      { slot: "11:00-13:00", maxPilgrims: 1800, bookedCount: 0 },
      { slot: "16:00-18:00", maxPilgrims: 2000, bookedCount: 0 },
      { slot: "18:00-20:00", maxPilgrims: 2000, bookedCount: 0 },
    ],
  },
  {
    name: "Kalikamata Temple, Pavagadh",
    location: "Panchmahal, Gujarat",
    totalCapacity: 9000,
    currentOccupancy: 0,
    darshanTimings: [
      { slot: "06:00-08:00", maxPilgrims: 1500, bookedCount: 0 },
      { slot: "08:00-10:00", maxPilgrims: 1700, bookedCount: 0 },
      { slot: "10:00-12:00", maxPilgrims: 1700, bookedCount: 0 },
      { slot: "16:00-18:00", maxPilgrims: 2000, bookedCount: 0 },
      { slot: "18:00-20:00", maxPilgrims: 2100, bookedCount: 0 },
    ],
  },
];

const ensureDefaultTemples = async () => {
  const count = await Temple.countDocuments();
  if (count === 0) {
    await Temple.insertMany(defaultTemples);
  }
};

const getTemples = async (req, res, next) => {
  try {
    await ensureDefaultTemples();
    const temples = await Temple.find().sort({ name: 1 });
    return res.status(200).json({ temples });
  } catch (error) {
    return next(error);
  }
};

const getTempleById = async (req, res, next) => {
  try {
    const temple = await Temple.findById(req.params.id);
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }
    return res.status(200).json({ temple });
  } catch (error) {
    return next(error);
  }
};

const createTemple = async (req, res, next) => {
  try {
    const temple = await Temple.create(req.body);
    return res.status(201).json({ message: "Temple created", temple });
  } catch (error) {
    return next(error);
  }
};

const updateTemple = async (req, res, next) => {
  try {
    const temple = await Temple.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }
    return res.status(200).json({ message: "Temple updated", temple });
  } catch (error) {
    return next(error);
  }
};

const deleteTemple = async (req, res, next) => {
  try {
    const temple = await Temple.findByIdAndDelete(req.params.id);
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }
    return res.status(200).json({ message: "Temple deleted" });
  } catch (error) {
    return next(error);
  }
};

const seedTemples = async (req, res, next) => {
  try {
    const ops = defaultTemples.map((temple) => ({
      updateOne: {
        filter: { name: temple.name },
        update: { $set: temple },
        upsert: true,
      },
    }));

    const result = await Temple.bulkWrite(ops);
    return res.status(200).json({
      message: "Temple seed completed",
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTemples,
  getTempleById,
  createTemple,
  updateTemple,
  deleteTemple,
  seedTemples,
};
