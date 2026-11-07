import { FabricObject, InteractiveFabricObject, Textbox } from 'fabric';

// Top-left origin keeps positions intuitive (matches the x/y inputs in the Position panel).
FabricObject.ownDefaults.originX = 'left';
FabricObject.ownDefaults.originY = 'top';
// Custom properties that must survive save/load.
FabricObject.customProperties = ['pgId', 'pgName', 'pgKind', 'pgLocked', 'pgAdjust', 'pgFilter', 'pgOriginalSrc', 'pgFrame', 'pgFrameBox', 'pgTextBg', 'pgUpper'];

// Selection handle styling
InteractiveFabricObject.ownDefaults = {
  ...InteractiveFabricObject.ownDefaults,
  borderColor: '#1D5FD1',
  cornerColor: '#FFFFFF',
  cornerStrokeColor: '#1D5FD1',
  cornerStyle: 'circle',
  cornerSize: 12,
  transparentCorners: false,
  borderScaleFactor: 1.5,
  padding: 2,
};
Textbox.ownDefaults.splitByGrapheme = false;

export {};
