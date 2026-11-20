'use strict';

const { Buffer } = require('node:buffer');
const { timingSafeEqual } = require('node:crypto');

const originalEqual = Buffer.prototype.equal;

function bufferEqual(left, right) {
  return Buffer.isBuffer(left) && Buffer.isBuffer(right) &&
    left.length === right.length && timingSafeEqual(left, right);
}

bufferEqual.install = function install() {
  Buffer.prototype.equal = function equal(other) {
    return bufferEqual(this, other);
  };
};

bufferEqual.restore = function restore() {
  Buffer.prototype.equal = originalEqual;
};

module.exports = bufferEqual;
