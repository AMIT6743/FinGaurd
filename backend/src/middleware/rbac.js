/**
 * Middleware to handle role-based access control.
 * Takes a list of allowed roles and checks if the authenticated user has one of them.
 */
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. User authentication required.' });
    }

    const { role } = req.user;

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied. Your role '${role}' does not have permission to access this resource.`
    });
  };
};

module.exports = rbacMiddleware;
