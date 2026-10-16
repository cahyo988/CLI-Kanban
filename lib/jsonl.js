'use strict';
const fs = require('fs');

const CHUNK = 4 << 20;
const NL = 0x0a;

// Record types that carry nothing the kanban needs. They make up most of a transcript's
// bytes, so they are dropped by a cheap prefix check before JSON.parse.
const SKIP_MARKERS = [
  '"type":"api-request',
  '"type":"file-history',
  '"type":"mode"',
  '"type":"permission-mode"',
  '"type":"isolation-latch"',
  '"type":"atis-latch"',
  '"type":"api-request-shape"',
];
const SKIP_ATTACHMENTS = /"attachment":\{"type":"(total_tokens_reminder|deferred_tools_record|deferred_tools_delta|silent_turn_reminder|skill_listing|agent_listing_delta|mcp_instructions_delta|environment|instructions|date|model|file|edited_text_file|compact_file_reference|prompt_snapshot|todo_reminder|auto_mode|session_context|remote_session_change)"/;

function shouldSkip(head) {
  for (const m of SKIP_MARKERS) if (head.includes(m)) return true;
  return head.includes('"attachment":{') && SKIP_ATTACHMENTS.test(head);
}

/**
 * Read complete lines of `file` from byte `offset` and hand each parsed record to `onRecord`.
 * Returns the offset just past the last complete line, so a half-written trailing line is
 * picked up on the next read.
 */
function readFrom(file, offset, onRecord) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
  } catch {
    return offset;
  }
  try {
    const size = fs.fstatSync(fd).size;
    let pos = offset;
    let carry = null;
    let committed = offset;
    const buf = Buffer.allocUnsafe(CHUNK);
    while (pos < size) {
      const n = fs.readSync(fd, buf, 0, Math.min(CHUNK, size - pos), pos);
      if (n <= 0) break;
      pos += n;
      let data = buf.subarray(0, n);
      if (carry) {
        data = Buffer.concat([carry, data]);
        carry = null;
      }
      let start = 0;
      let idx;
      while ((idx = data.indexOf(NL, start)) !== -1) {
        handleLine(data, start, idx, onRecord);
        start = idx + 1;
      }
      committed = pos - (data.length - start);
      if (start < data.length) carry = Buffer.from(data.subarray(start));
    }
    return committed;
  } finally {
    fs.closeSync(fd);
  }
}

function handleLine(data, start, end, onRecord) {
  if (end - start < 2) return;
  const head = data.toString('utf8', start, Math.min(end, start + 200));
  if (shouldSkip(head)) return;
  let rec;
  try {
    rec = JSON.parse(data.toString('utf8', start, end));
  } catch {
    return;
  }
  onRecord(rec);
}

module.exports = { readFrom };
