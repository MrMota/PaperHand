# Test plan: Pigment

Tests run against **our clone only** (local `vite preview` build). Nothing touches Canva.
Not applicable to this app (no backend, no accounts, no payments): wrong password, expired session,
second user's data, card declined, time zones. Noted here so the omission is deliberate.

Legend: **A** = automated in `e2e/`, **M** = manual / browser click-through, **–** = not applicable.

## F01 Start from a template and download
| ID | case | how |
| --- | --- | --- |
| F01-H1 | Home → click template → editor opens with template content, title = template name | A |
| F01-H2 | Download PNG of a template → file named after the design | A |
| F01-E1 | Double-click template card → only one design created | A |
| F01-E2 | Refresh in editor → same design reloads with content | A |
| F01-E3 | Back button from editor → home shows the design in Recent | A |
| F01-E4 | Mobile width 390px → template opens, canvas fits viewport | A |
| F01-E5 | Keyboard only: Tab to a template card, Enter opens it | A |
| F01-E6 | Accessibility scan (axe) on home, templates page and editor | A |

## F02 Blank design of a preset or custom size
| F02-H1 | Click a size preset → blank page at that size | A |
| F02-H2 | Custom size 800×600 px → design is 800 × 600 | A |
| F02-E1 | Unit conversion: 4 × 6 in → 384 × 576 px | A |
| F02-N1 | Width 0 or 9000 → error shown, Create disabled | A |
| F02-E2 | Empty input → error, no design created | A |

## F03 Add and arrange elements
| F03-H1 | Add shape from Elements → appears selected | A |
| F03-H2 | Undo removes it, redo restores it | A |
| F03-H3 | Duplicate (Ctrl+D) → 2 objects; Delete → 1 | A |
| F03-H4 | Select all + Group → 1 group; Ungroup → original count | A |
| F03-H5 | Lock → delete key does nothing; unlock → deletes | A |
| F03-H6 | Copy/paste offsets the copy | A |
| F03-H7 | Align centre to page | A |
| F03-E1 | Elements search "zzz" → no-results message | A |
| F03-E2 | Snapping guide while dragging near page centre | A (was M) |
| F03-E3 | Right-click → context menu actions work | A |
| F03-E4 | Arrow keys nudge 1px, shift 10px | A |
| F03-E5 | Layers panel: hide, lock, reorder | A |

## F04 Edit text
| F04-H1 | Add heading, change font/size/colour/bold/align | A |
| F04-H2 | Double-click text, type, Esc → text saved | A |
| F04-E1 | Emoji and accents ("Café 🎨 Ünïcode") render and persist after reload | A |
| F04-E2 | Very long text (2000 chars) pasted → wraps, no crash | A |
| F04-E3 | Text effects: outline / neon apply | A |
| F04-E4 | Keyboard shortcuts while editing text do not delete the element (Backspace) | A |

## F05 Upload a photo and remove its background
| F05-H1 | Upload PNG → appears in Uploads, click adds to page | A |
| F05-H2 | Remove background (plain-background method) → corners transparent; Restore → original | A |
| F05-E1 | Upload persists after reload | A |
| F05-N1 | Upload a non-image file → error toast, nothing added | A |
| F05-E2 | AI method offline → falls back to colour method with a message | A (model host blocked = offline) |
| F05-E3 | AI method with network → real cut-out | M (sandbox cannot reach model host) |
| F05-E4 | Paste an image from clipboard | M |
| F05-E5 | Drag & drop file onto the page | A |

## F06 Photo adjustments & crop
| F06-H1 | Apply filter preset → image pixels change | A |
| F06-H2 | Adjust brightness slider → persists after reload | A |
| F06-H3 | Crop zoom changes displayed crop, frame shape applies clip | A |
| F06-H4 | Flip horizontal toggles flipX | A |
| F06-E1 | Add frame, then click upload → image fills frame | A |

## F07 Multi-page
| F07-H1 | Add, duplicate, move, delete pages; page count and order correct | A |
| F07-H2 | Undo is per page and survives switching pages | A |
| F07-E1 | Deleting the last remaining page clears it instead | A |

## F08 Page background
| F08-H1 | Colour, gradient and image backgrounds apply and persist | A |

## F09 Resize design
| F09-H1 | Resize 1080² → 1920×1080 with scale content | A |

## F10 Draw
| F10-H1 | Draw a stroke → becomes an element; closing panel stops drawing | A |

## F11 Reopen a recent design
| F11-H1 | Edit, go home, reopen → edits present | A |
| F11-E1 | Rename, duplicate, delete from home menu | A |
| F11-E2 | Two tabs on the same design: a save in one tab is not overwritten by the other | A (was M) |
| F11-N1 | Unknown design id → "Design not found" | A |

## F12 Download
| F12-H1 | JPG, PDF (multi-page), SVG all download | A |
| F12-E1 | Transparent PNG has alpha 0 in an empty corner | A |
| F12-E2 | Export ×2 doubles pixel size | A |
| F11-E3 | Edit then leave the editor within the autosave delay → edit kept | A (added during testing) |
