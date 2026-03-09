const mongoose = require("mongoose");

const passSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    numPilgrims: {
      type: Number,
      required: true,
      min: 1,
    },
    darshanSlot: {
      type: String,
      required: true,
      trim: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    qrData: {
      type: String,
      required: true,
    },
    queueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
    },
    tokenNumber: {
      type: Number,
      min: 1,
    },
    status: {
      type: String,
      enum: ["booked", "used", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pass", passSchema);
