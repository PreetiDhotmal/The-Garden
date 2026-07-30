/**
 * The rigid body's origin is the capsule collider's CENTER (Rapier's
 * default — no explicit offset is ever applied), not its feet. The
 * ground-check ray needs to originate from the capsule's actual
 * bottom, which is capsuleHeight/2 below that center — subtracting
 * only a small tuning value (groundCheckDistance) instead of the
 * full half-height was a real, confirmed bug: it made isGrounded
 * permanently false once a character was genuinely standing on the
 * ground, because the ray's total range never reached that far down.
 */
export function computeFootPositionY(bodyOriginY: number, capsuleHeight: number): number {
  return bodyOriginY - capsuleHeight / 2;
}
