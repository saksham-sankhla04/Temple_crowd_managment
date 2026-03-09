const QRCode = require("qrcode");
const Booking = require("../models/Booking");
const Temple = require("../models/Temple");

const createBooking = async (req, res, next) => {
  try {
    const { templeId, visitDate, devoteesCount = 1 } = req.body;

    if (!templeId || !visitDate) {
      return res.status(400).json({ message: "templeId and visitDate are required" });
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      temple: temple._id,
      visitDate,
      devoteesCount,
    });

    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      temple: temple.name,
      visitDate: booking.visitDate.toISOString().split("T")[0],
      devoteesCount: booking.devoteesCount,
    });
    booking.qrCode = await QRCode.toDataURL(qrPayload);
    await booking.save();

    return res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    return next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("temple", "name location totalCapacity currentOccupancy darshanTimings")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createBooking, getMyBookings };
