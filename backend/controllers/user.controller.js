const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const { ROLES } = require('../../shared/constants');

/**
 * PUT /api/v1/users/:id
 * Role: self or admin
 * Body: {name?, phone?, address?}
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;

    const isSelf = req.user.id === id;
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isSelf && !isAdmin) {
      throw new ApiError('You can only update your own profile', 403, 'FORBIDDEN');
    }

    const allowedFields = ['name', 'phone', 'address'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new ApiError('User not found', 404, 'NOT_FOUND');

    return success(res, { user: user.toSafeJSON() }, 'Profile updated');
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/users
 * Role: admin
 * Query: role?, state?
 */
async function listUsers(req, res, next) {
  try {
    const { role, state } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (state) filter.state = state;

    const users = await User.find(filter).sort({ createdAt: -1 });
    return success(res, { users: users.map((u) => u.toSafeJSON()) }, 'OK');
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/users/:id/status
 * Role: admin
 * Body: {isActive}
 */
async function setUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ApiError('isActive must be a boolean', 400, 'VALIDATION_ERROR', [
        { field: 'isActive', issue: 'must be boolean' },
      ]);
    }

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) throw new ApiError('User not found', 404, 'NOT_FOUND');

    return success(res, { user: user.toSafeJSON() }, 'User status updated');
  } catch (err) {
    return next(err);
  }
}

module.exports = { updateUser, listUsers, setUserStatus };
