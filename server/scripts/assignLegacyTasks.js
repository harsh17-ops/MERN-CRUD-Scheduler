import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run migrate:legacy -- account@example.com');
  process.exitCode = 1;
} else if (!process.env.ATLAS_URI) {
  console.error('ATLAS_URI is missing. Configure .env first.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.ATLAS_URI, { dbName: 'taskflow' });
    const user = await User.findOne({ email });
    if (!user) throw new Error(`No account found for ${email}. Create the account before migrating.`);

    // Claim only records from the original single-user app that have no owner.
    const result = await Task.updateMany(
      { $or: [{ owner: { $exists: false } }, { owner: null }] },
      { $set: { owner: user._id } },
    );
    console.log(`Assigned ${result.modifiedCount} legacy task(s) to ${email}.`);
  } catch (error) {
    console.error(`Legacy task migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
