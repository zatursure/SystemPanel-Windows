const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '未登录' 
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: '登录已过期' 
    })
  }
}

module.exports = authMiddleware
