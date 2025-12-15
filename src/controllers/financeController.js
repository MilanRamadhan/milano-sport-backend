import Finance from "../models/Finance.js";

// Get all finance records with optional filters
export const getAllFinanceRecords = async (req, res) => {
  try {
    const { from, to, type } = req.query;

    let query = {};

    // Filter by type
    if (type && (type === "income" || type === "expense")) {
      query.type = type;
    }

    // Filter by date range
    if (from || to) {
      query.date = {};
      if (from) {
        query.date.$gte = new Date(from);
      }
      if (to) {
        query.date.$lte = new Date(to);
      }
    }

    const records = await Finance.find(query).populate("createdBy", "name email").sort({ date: -1 });

    return res.status(200).json({
      status: 200,
      data: records,
      message: "Finance records berhasil diambil",
    });
  } catch (error) {
    console.error("Error getting finance records:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengambil finance records",
    });
  }
};

// Create new finance record
export const createFinanceRecord = async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || !amount || !description) {
      return res.status(400).json({
        status: 400,
        message: "Semua field harus diisi",
      });
    }

    const newRecord = new Finance({
      type,
      category,
      amount,
      description,
      date: date || new Date(),
      createdBy: req.user.id,
    });

    await newRecord.save();

    const populatedRecord = await Finance.findById(newRecord._id).populate("createdBy", "name email");

    return res.status(201).json({
      status: 201,
      data: populatedRecord,
      message: "Finance record berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating finance record:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal membuat finance record",
    });
  }
};

// Update finance record
export const updateFinanceRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const updates = req.body;

    const record = await Finance.findByIdAndUpdate(recordId, updates, { new: true, runValidators: true }).populate("createdBy", "name email");

    if (!record) {
      return res.status(404).json({
        status: 404,
        message: "Finance record tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      data: record,
      message: "Finance record berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating finance record:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengupdate finance record",
    });
  }
};

// Delete finance record
export const deleteFinanceRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await Finance.findByIdAndDelete(recordId);

    if (!record) {
      return res.status(404).json({
        status: 404,
        message: "Finance record tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Finance record berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting finance record:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal menghapus finance record",
    });
  }
};
