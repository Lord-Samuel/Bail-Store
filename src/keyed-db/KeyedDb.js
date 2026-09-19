'use strict';

const binarySearch = require('./BinarySearch');

class KeyedDB {
    /**
     * @param {{ key: (v: any) => any, compare: (a: any, b: any) => number }} key
     * @param {(v: any) => string} [id]
     */
    constructor(key, id) {
        this.key       = key;
        this.idGetter  = id || ((v) => this.key.key(v).toString());
        this.dict      = {};
        this.array     = [];
    }

    get length() { return this.array.length; }
    get first()  { return this.array[0]; }
    get last()   { return this.array[this.array.length - 1]; }

    toJSON() { return this.array; }

    /**
     * Insert items in k·logN time.
     * @param {...any} values
     */
    insert(...values) {
        values.forEach((v) => this._insertSingle(v));
    }

    /**
     * Upsert items in 2k·logN time.
     * Duplicates are deleted first, then re-inserted.
     * @param {...any} values
     * @returns {any[]} list of updated values
     */
    upsert(...values) {
        const updates = [];
        values.forEach((v) => {
            if (!v) return;
            const deleted = this.deleteById(this.idGetter(v), false);
            this._insertSingle(v);
            if (deleted) updates.push(v);
        });
        return updates;
    }

    /**
     * Insert only if the ID and key are both absent.
     * @param {...any} values
     * @returns {any[]} list of inserted values
     */
    insertIfAbsent(...values) {
        const insertions = [];
        values.forEach((v) => {
            if (!v) return;

            const presentValue = this.get(this.idGetter(v));
            if (presentValue) return;

            const presentKey = this.firstIndex(v);
            if (
                this.array[presentKey] &&
                this.key.key(this.array[presentKey]) === this.key.key(v)
            ) return;

            this.insert(v);
            insertions.push(v);
        });
        return insertions;
    }

    /**
     * @param {string} id
     * @param {boolean} [assertPresent=true]
     */
    deleteById(id, assertPresent = true) {
        const value = this.get(id);
        if (!value) {
            if (assertPresent) throw new Error('Value not found');
            return;
        }
        return this.delete(value);
    }

    delete(value) {
        const index = this.firstIndex(value);
        if (
            index < 0 ||
            index >= this.array.length ||
            this.key.key(value) !== this.key.key(this.array[index])
        ) {
            return null;
        }
        delete this.dict[this.idGetter(value)];
        return this.array.splice(index, 1)[0];
    }

    slice(start, end) {
        const db = new KeyedDB(this.key, this.idGetter);
        db.array = this.array.slice(start, end);
        db.array.forEach((item) => (db.dict[this.idGetter(item)] = item));
        return db;
    }

    clear() {
        this.array = [];
        this.dict  = {};
    }

    get(id) { return this.dict[id]; }
    all()   { return this.array; }

    /**
     * Update a value by ID; re-sorts if the key changed.
     * @returns {1|2|undefined}
     *   1 = updated in place
     *   2 = updated and moved
     */
    update(id, update) {
        const value = this.get(id);
        if (!value) return;

        const idx = this.firstIndex(value);
        if (idx < 0 || idx >= this.array.length || this.idGetter(this.array[idx]) !== id) {
            return;
        }

        const oldKey = this.key.key(value);
        update(value);
        const newKey = this.key.key(value);

        if (newKey !== oldKey) {
            delete this.dict[id];
            this.array.splice(idx, 1);
            this._insertSingle(value);
            return 2;
        }
        return 1;
    }

    /** @deprecated use update() */
    updateKey(value, update) {
        return this.update(this.idGetter(value), update);
    }

    filter(predicate) {
        const db = new KeyedDB(this.key, this.idGetter);
        db.array = this.array.filter((value, index) => {
            if (predicate(value, index)) {
                db.dict[this.idGetter(value)] = value;
                return true;
            }
            return false;
        });
        return db;
    }

    /**
     * Paginate using a full value (extracts key first).
     */
    paginatedByValue(value, limit, predicate, mode = 'after') {
        return this.paginated(value && this.key.key(value), limit, predicate, mode);
    }

    /**
     * Paginate by key.
     * @param {any|null} cursor
     * @param {number} limit
     * @param {(value: any, index: number) => boolean} [predicate]
     * @param {'before'|'after'} [mode='after']
     */
    paginated(cursor, limit, predicate, mode = 'after') {
        let index = mode === 'after' ? 0 : this.array.length;

        if (cursor !== null && typeof cursor !== 'undefined') {
            index = binarySearch(this.array, (v) =>
                this.key.compare(cursor, this.key.key(v))
            );

            if (index < 0) index = 0;
            if (this.key.key(this.array[index]) === cursor) {
                index += mode === 'after' ? 1 : 0;
            }
        }

        return this.filtered(index, limit, mode, predicate);
    }

    // ───────────────────────── internals ─────────────────────────

    _insertSingle(value) {
        if (!value) throw new Error('falsey value');

        const valueID = this.idGetter(value);
        if (this.get(valueID)) {
            throw new Error('duplicate ID being inserted: ' + valueID);
        }

        if (this.array.length > 0) {
            const index = this.firstIndex(value);

            if (index >= this.array.length) this.array.push(value);
            else if (index < 0) this.array.unshift(value);
            else if (this.key.key(value) !== this.key.key(this.array[index])) {
                this.array.splice(index, 0, value);
            } else {
                throw new Error(
                    `duplicate key: ${this.key.key(value)}, ` +
                    `of inserting: ${valueID}, ` +
                    `present: ${this.idGetter(this.array[index])}`
                );
            }
        } else {
            this.array.push(value);
        }

        this.dict[valueID] = value;
    }

    filtered(start, count, mode, predicate) {
        let arr;

        if (mode === 'after') {
            if (predicate) {
                arr = [];
                for (const item of this.array.slice(start)) {
                    predicate(item, start + arr.length) && arr.push(item);
                    if (arr.length >= count) break;
                }
            } else {
                arr = this.array.slice(start, start + count);
            }
        } else if (mode === 'before') {
            if (predicate) {
                arr = [];
                for (let i = start - 1; i >= 0; i--) {
                    const item = this.array[i];
                    predicate(item, start + arr.length) && arr.unshift(item);
                    if (arr.length >= count) break;
                }
            } else {
                arr = this.array.slice(Math.max(start - count, 0), start);
            }
        }

        return arr;
    }

    firstIndex(value) {
        const valueKey = this.key.key(value);
        return binarySearch(this.array, (v) =>
            this.key.compare(valueKey, this.key.key(v))
        );
    }

    *[Symbol.iterator]() {
        for (const item of this.array) yield item;
    }
}

module.exports = KeyedDB;
module.exports.default = KeyedDB; 
