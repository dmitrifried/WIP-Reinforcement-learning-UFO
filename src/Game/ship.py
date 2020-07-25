import math

class Vector:
  def __init__(self, x, y):
    self.x = x
    self.y = y
  
  def __add__(self, v):
    return Vector(self.x + v.x, self.y + v.y)
  
  def __mult__(self, c):
    return Vector(self.x * c, self.y * c)

  def limit(self, xLo, xHi, yLo, yHi):
    if self.x < xLo:
      self.x = xLo
    elif self.x > xHi:
      self.x = xHi

    if self.y < yLo:
      self.y = yLo
    elif self.y > yHi:
      self.y = yHi

class Ship:
  def __init__(self, x, y):
    self.minX = 20
    self.maxX = 780
    self.minY = 20
    self.maxY = 480

    self.p = Vector(x, y)
    self.v = Vector(0, 0)
    self.aV = 0
    self.le = True
    self.re = True
    self.theta = 0

    self.gravity = 300.0

    self.engineForce = 250.0

    self.engineTorque = 0.1

    self.velocityDecay = 0.2
    
    self.angularDecay = 0.2
    
  def acceleration(self):
    engineMult = self.le + self.re
    ay = self.gravity + engineMult * math.sin(self.theta)
    ax = engineMult * math.cos(self.theta)
    return Vector(ax, ay)

  def angularAcceleration(self):
    if self.le and not self.re:
      return self.engineTorque
    elif not self.le and self.re:
      return -self.engineTorque
    else:
      return 0
  
  def applyPhysics(self, deltaT):
    deltaT = deltaT / 1000.0

    # y is inverted
    a = self.acceleration()
    aA = self.angularAcceleration()

    self.p += self.v * deltaT
    self.p.limit(self.minX, self.maxX, self.minY, self.maxY)
    
    self.v *= 1 - deltaT * self.velocityDecay
    self.v += a * deltaT
    if self.p.x <= self.minX or self.p.y >= self.maxX:
      self.v.x *= 0.001
    
    if self.p.y <= self.minY or self.p.y >= self.maxY:
      self.v.y *= 0.001
    
    self.aV *= 1 - deltaT * self.angularDecay
    self.aV += aA;