# Rotation Handling in Slopcore

## Overview
This document describes how rotations are handled throughout the codebase, particularly focusing on the use of quaternions for representing and transmitting rotation data.

## Core Principles
- Use quaternions as the primary rotation representation
- Convert user input from Euler angles to quaternions
- Transmit quaternion components over the network
- Maintain consistent rotation order (YXZ) for Euler angle conversions

## Implementation Details

### Player Rotation
```typescript
class Player {
  private rotation: THREE.Quaternion;      // Internal rotation state
  private lookEuler: THREE.Euler;          // For input handling only
  
  public getRotation(): THREE.Quaternion {
    return this.rotation.clone();
  }
  
  public setRotation(rotation: THREE.Quaternion): void {
    this.rotation.copy(rotation);
    this.object.quaternion.copy(this.rotation);
    this.lookEuler.setFromQuaternion(this.rotation, 'YXZ');
  }
}
```

### Network Protocol
Rotations are transmitted as quaternion components:
```typescript
interface Rotation {
  _x: number;  // Quaternion x component
  _y: number;  // Quaternion y component
  _z: number;  // Quaternion z component
  _w: number;  // Quaternion w component
}
```

### Input Handling
1. User input is processed in Euler angles for intuitive control
2. Euler angles are immediately converted to quaternions
3. All subsequent operations use quaternions

## Benefits
- Avoids gimbal lock issues
- More efficient network transmission (4 components vs 9 for matrices)
- Better interpolation between rotations
- Consistent with Three.js's internal representation
- Numerically stable for all possible rotations

## Common Operations

### Converting Input to Quaternion
```typescript
// In input handler:
this.lookEuler.x += pitchDelta;
this.lookEuler.y += yawDelta;
this.lookEuler.z += rollDelta;
this.rotation.setFromEuler(this.lookEuler);
```

### Applying Rotation to Objects
```typescript
// Direct quaternion application:
object.quaternion.copy(rotation);

// For direction vectors:
direction.applyQuaternion(rotation);
```

### Network Transmission
```typescript
// Sending:
socket.emit('position_update', {
  position: { x, y, z },
  rotation: {
    _x: quaternion.x,
    _y: quaternion.y,
    _z: quaternion.z,
    _w: quaternion.w
  }
});

// Receiving:
const rotation = new THREE.Quaternion(data._x, data._y, data._z, data._w);
player.setRotation(rotation);
```

## Best Practices
1. Always clone quaternions when getting them from objects
2. Use the same rotation order ('YXZ') consistently when converting from Euler angles
3. Keep Euler angle usage confined to input handling
4. Use quaternion methods for combining rotations
5. Apply quaternions directly to Three.js objects

## Testing
When writing tests for rotation:
1. Use known quaternion values
2. Test edge cases (90-degree rotations, full rotations)
3. Verify network serialization/deserialization
4. Check input handling conversion accuracy
5. Validate interpolation between rotations 