const User = require('../models/User');

function checkRole(allowedRoles, requiredPermission = null) {
  return async (req, res, next) => {
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'You do not have permission to do this.'
      });
    }

    // Admins automatically have all permissions
    if (userRole === 'admin') {
      return next();
    }

    // Check specific permission for non-admin users
    if (requiredPermission) {
      if (!userId) {
        return res.status(403).json({
          message: 'User information is missing.'
        });
      }

      const user = await User.findById(userId);

      if (
        !user ||
        !user.permissions ||
        !user.permissions[requiredPermission]
      ) {
        return res.status(403).json({
          message: 'You do not have permission to do this.'
        });
      }
    }

    next();
  };
}

module.exports = checkRole;