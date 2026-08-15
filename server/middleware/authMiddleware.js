const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

function getBearerToken(authHeader = "") {
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

function verifyToken(req, res, next, expectedRole) {
  const token = getBearerToken(req.headers.authorization || "");

  if (!token) {
    return res.status(401).json({ message: `Unauthorized - ${expectedRole || "access"} token required` });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-secret-key";
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: "Forbidden - Invalid authentication credentials" });
    }

    if (expectedRole === "teacher") {
      if (decoded.role !== "teacher") {
        return res.status(403).json({ message: "Forbidden - Teacher credentials required" });
      }
      req.teacher = decoded;
      req.user = decoded;
      return next();
    }

    if (expectedRole === "student") {
      if (decoded.role !== "student" || !decoded.registerNumber) {
        return res.status(403).json({ message: "Forbidden - Student credentials required" });
      }
      req.student = decoded;
      req.user = decoded;
      return next();
    }

    if (decoded.role === "student") {
      req.student = decoded;
    } else if (decoded.role === "teacher") {
      req.teacher = decoded;
    } else if (decoded.registerNumber) {
      req.student = decoded;
    } else {
      req.teacher = decoded;
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: `Invalid or expired ${expectedRole || "auth"} token` });
  }
}

function requireTeacherAuth(req, res, next) {
  return verifyToken(req, res, next, "teacher");
}

function requireStudentAuth(req, res, next) {
  return verifyToken(req, res, next, "student");
}

function requireAuth(req, res, next) {
  return verifyToken(req, res, next, null);
}

module.exports = { requireTeacherAuth, requireStudentAuth, requireAuth, getBearerToken };