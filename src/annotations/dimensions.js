import { dim } from '../lib/labels.js';
import { X, Z } from '../config/dimensions.js';

export function build() {
  dim(X.w, Z.n, X.e, Z.n, '40\'-4"');
  dim(X.w, Z.n, X.w, Z.entry, '20\'-4"');
  dim(X.w, Z.entry, X.w, Z.shopS, '27\'-6"', 0.06, 5.5);
  dim(X.w, Z.entry, X.shopE, Z.entry, '10\'-0"', 0.06, -3);
  dim(X.shopE, Z.entry, X.stairW, Z.entry, '19\'-10"', 0.06, -3);
  dim(X.stairW, Z.n, X.e, Z.n, '9\'-8"', 0.06, 5.5);
  dim(X.shopE, Z.entry, X.shopE, Z.shutter, '15\'-4"', 0.06, -1.5);
  dim(X.e, Z.shutter, X.e, Z.verandha, '6\'-0"', 0.06, -3);
}
