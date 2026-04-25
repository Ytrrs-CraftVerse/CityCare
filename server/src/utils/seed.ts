import User from "../models/User";

export const seedAdmin = async (): Promise<void> => {
  try {
    const existing = await User.findOne({ email: "admin@citycare.com" });
    if (!existing) {
      await User.create({
        name: "Admin",
        email: "admin@citycare.com",
        password: "admin123",
        role: "admin",
        reputationScore: 100,
      });
      console.log("✅ Admin user seeded: admin@citycare.com / admin123");
    }

    const superAdmin = await User.findOne({ email: "superadmin@citycare.com" });
    if (!superAdmin) {
      await User.create({
        name: "Super Admin",
        email: "superadmin@citycare.com",
        password: "super123",
        role: "super-admin",
        reputationScore: 200,
      });
      console.log("✅ Super-Admin seeded: superadmin@citycare.com / super123");
    }
  } catch (err: any) {
    console.error("Seed error:", err.message);
  }
};
