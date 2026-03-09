const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    templeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Temple",
      required: true,
    },
    pilgrimName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    darshanSlot: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["waiting", "called", "completed", "cancelled"],
      default: "waiting",
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);

