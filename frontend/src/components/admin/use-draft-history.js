"use client";

import { useReducer } from "react";
import { draftFingerprint } from "./draft-state";

const initial = { present: null, past: [], future: [], group: null, time: 0 };

function reducer(state, action) {
  if (action.type === "reset") return { ...initial, present: action.value };
  if (action.type === "boundary") return { ...state, group: null };
  if (action.type === "saved")
    return { ...state, present: action.value, group: null };
  if (action.type === "undo") {
    if (!state.past.length) return state;
    const entry = state.past.at(-1);
    return {
      ...state,
      present: entry.value,
      past: state.past.slice(0, -1),
      future: [
        { value: state.present, context: entry.context },
        ...state.future,
      ],
      group: null,
    };
  }
  if (action.type === "redo") {
    if (!state.future.length) return state;
    const entry = state.future[0];
    return {
      ...state,
      present: entry.value,
      past: [...state.past, { value: state.present, context: entry.context }],
      future: state.future.slice(1),
      group: null,
    };
  }
  const next = action.update(state.present);
  if (draftFingerprint(next) === draftFingerprint(state.present)) return state;
  const grouped =
    action.group &&
    state.group === action.group &&
    state.past.at(-1)?.context === action.context &&
    action.time - state.time < 750 &&
    !state.future.length;
  return {
    present: next,
    past: grouped
      ? state.past
      : [...state.past, { value: state.present, context: action.context }],
    future: [],
    group: action.group,
    time: action.time,
  };
}

export default function useDraftHistory({ context = null, onRestore } = {}) {
  const [state, dispatch] = useReducer(reducer, initial);
  return {
    draft: state.present,
    undoCount: state.past.length,
    redoCount: state.future.length,
    setDraft: (value) => dispatch({ type: "reset", value }),
    acceptSaved: (value) => dispatch({ type: "saved", value }),
    changeDraft: (update, group = null) =>
      dispatch({ type: "change", update, group, context, time: Date.now() }),
    undo: () => {
      if (!state.past.length) return;
      onRestore?.(state.past.at(-1).context);
      dispatch({ type: "undo" });
    },
    redo: () => {
      if (!state.future.length) return;
      onRestore?.(state.future[0].context);
      dispatch({ type: "redo" });
    },
    breakGroup: () => dispatch({ type: "boundary" }),
  };
}
