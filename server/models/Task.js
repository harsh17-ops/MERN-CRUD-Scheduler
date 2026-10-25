import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Add a task title.'], trim: true, maxlength: 160 },
  dueDate: { type: Date, required: [true, 'Choose a due date.'] },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['planned', 'completed'], default: 'planned' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Most schedule reads are scoped to one owner and ordered by due date.
taskSchema.index({ owner: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
