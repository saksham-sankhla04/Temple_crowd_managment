const mongoose = require("mongoose");

const darshanTimingSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      required: true,
      trim: true,
    },
    maxPilgrims: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const templeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    darshanTimings: {
      type: [darshanTimingSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Temple", templeSchema);
