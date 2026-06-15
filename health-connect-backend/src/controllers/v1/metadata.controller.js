import MedicalDepartment from '../../models/MedicalDepartment.js';

export const getDepartments = async (req, res) => {
  try {
    // Fetch all active departments and sort them alphabetically
    const departments = await MedicalDepartment.find({ is_active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ success: false, message: 'Server error fetching departments.' });
  }
};