//Ponyfill for structuredClone which is not supported by the Locker Service.

//Shamelessly stolen from https://javascript.plainenglish.io/write-a-better-deep-clone-function-in-javascript-d0e798e5f550

//Modified a bit to:
//  1.  Throw on Symbol clone.  This could have unexpected side effects if a Symbol
//      is used as an Enum.  A cloned Symbol will always be unequal to the original.

//@todo Replace with structuredClone if/once supported by the Locker Service

function cloneOtherType(target) {
    const constrFun = target.constructor;
    switch (toRawType(target)) {
        case "Boolean":
        case "Number":
        case "String":
        case "Error":
        case "Date":
            return new constrFun(target);
        case "RegExp":
            return cloneReg(target);
        case "Symbol":
            //Throw an error here as we don't want to support this
            throw new TypeError("Cannot clone a Symbol");
        case "Function":
            return target;
        default:
            return null;
    }
}

function toRawType(value) {
    let _toString = Object.prototype.toString;
    let str = _toString.call(value)
    return str.slice(8, -1)
}

function cloneReg(target) {
    const reFlags = /\w*$/;
    const result = new target.constructor(target.source, reFlags.exec(target));
    result.lastIndex = target.lastIndex;
    return result;
}

function forEach(array, iteratee) {
    let index = -1;
    const length = array.length;
    while (++index < length) {
        iteratee(array[index], index);
    }
    return array;
}

// core function
/**
 * @template T
 * @param {T} value
 * @return {T}
 */
export default function deepClone(value) {
    return clone(value);
}

function clone(target, map = new WeakMap()) {

    // clone primitive types
    if (typeof target != "object" || target == null) {
        return target;
    }

    const type = toRawType(target);
    let cloneTarget = null;

    if (map.get(target)) {
        return map.get(target);
    }
    map.set(target, cloneTarget);

    if (type != "Set" && type != "Map" && type != "Array" && type != "Object") {
        return cloneOtherType(target)
    }

    // clone Set
    if (type == "Set") {
        cloneTarget = new Set();
        target.forEach(value => {
            cloneTarget.add(clone(value, map));
        });
        return cloneTarget;
    }

    // clone Map
    if (type == "Map") {
        cloneTarget = new Map();
        target.forEach((value, key) => {
            cloneTarget.set(key, clone(value, map));
        });
        return cloneTarget;
    }

    // clone Array
    if (type == "Array") {
        cloneTarget = [];
        forEach(target, (value, index) => {
            cloneTarget[index] = clone(value, map);
        })
    }

    // clone normal Object
    if (type == "Object") {
        cloneTarget = {};
        forEach(Object.keys(target), (key, index) => {
            cloneTarget[key] = clone(target[key], map);
        })
    }

    return cloneTarget;
}
