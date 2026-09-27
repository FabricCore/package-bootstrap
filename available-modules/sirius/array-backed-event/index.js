/**
 * @import { Event } from "/types/full/net/fabricmc/fabric/api/event/Event"
 */

const JavaArray = Java.type("java.lang.reflect.Array");
const JavaInteger = Java.type("java.lang.Integer");
const EventClass = Java.type("net.fabricmc.fabric.api.event.Event");

/**
 * Fabric's Event<T> (see EventFactory.createArrayBacked / createWithPhases) only
 * ever grows -- there is no public removal API. This module reaches past it into
 * the array-backed impl (ArrayBackedEvent.phases -> EventPhaseData.listeners) to
 * splice a listener back out.
 *
 * Only works for events actually backed by that impl (true for anything built
 * with EventFactory, which is effectively all vanilla Fabric API events); an
 * event with a hand-rolled Event subclass will fail the reflective field lookups.
 *
 * @param {java.lang.Class<any>} cls
 * @param {string} name
 * @returns {java.lang.reflect.Field}
 */
function declaredField(cls, name) {
    const field = cls.getDeclaredField(name);
    field.setAccessible(true);
    return field;
}

/**
 * @template T
 */
class Handle {
    /**
     * @param {Event<T>} event 
     * @param {JavaFn<T>} listener 
     */
    constructor(event, listener) {
        /** @type {Event<T>} */
        this.event = event;
        /** @type {JavaFn<T> } */
        this.listener = listener;
    }

    unregister() {
        unregisterListener(this.event, this.listener);
    }
}

/**
 * Registers a listener and returns a handle that can later be passed to
 * unregister() to remove it. The handle just pairs the event with the exact
 * listener reference -- hang onto it, since a structurally-identical listener
 * created later is a different object and unregister() will not find it.
 *
 * @template T
 * @param {Event<T>} event
 * @param {JavaFn<T>} listener
 * @returns {Handle<T>}
 */
function registerListener(event, listener) {
    event.register(listener);
    return new Handle(event, listener);
}

/**
 * @template T
 * @param {Event<T>} event
 * @param {JavaFn<T>} listener
 * @returns {void}
 */
function unregisterListener(event, listener) {
    /** @type {java.lang.Object} */
    /// @ts-expect-error -- the generated Event<T> stub doesn't model that every Java value is also an Object
    const eventAsObject = event;
    const eventClass = eventAsObject.getClass();

    const phasesField = declaredField(eventClass, "phases");
    const phaseData = phasesField.get(event).get(EventClass.DEFAULT_PHASE);
    if (phaseData === null) throw new Error("no listeners registered on the default phase");

    const listenersField = declaredField(phaseData.getClass(), "listeners");
    const listeners = listenersField.get(phaseData);

    let found = false;
    const kept = [];
    for (let i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener) {
            found = true;
            continue;
        }
        kept.push(listeners[i]);
    }
    if (!found) throw new Error("listener was not registered");

    const newListeners = JavaArray.newInstance(listeners.getClass().getComponentType(), kept.length);
    kept.forEach((keptListener, i) => JavaArray.set(newListeners, i, keptListener));
    listenersField.set(phaseData, newListeners);

    const handlersField = declaredField(eventClass, "handlers");
    const newLength = handlersField.get(event).length - 1;

    const rebuildInvoker = eventClass.getDeclaredMethod("rebuildInvoker", JavaInteger.TYPE);
    rebuildInvoker.setAccessible(true);
    rebuildInvoker.invoke(event, JavaInteger.valueOf(newLength));
}

module.exports = { registerListener };
