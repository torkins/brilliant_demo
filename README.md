
# Demo for an interactive tool for Light Reflection 

Basic flow is:

## Edit mode
Add walls/mirrors/bunnys/phantoms, and a viewer. 

For the things you add, click on them and edit config options on the left.

The "viewer" stands in for a person and has an orientation they are viewing.  Reflections are from their perspective.

"Bunnies" are the targets that we will be looking at in the mirror.

"Phantoms" are for the game mode.  The stage-creator places phantoms to give incorrect options to the user in the game.

## Sandbox mode
User can move / rotate view, and move bunnies. Click Animate Ray to see the light path and the images it forms

## Game mode
Display the Phantoms placed by the stage-creator as well as a phantom in the real mirror image (in this case just the one the viewer sees).  User should click the correct one and get feedback. Click "Show Solution" for an explanation animation.


# Specification rendering
The system uses a JSON specification for the layout of the board. You can see/edit this in the debug panel on the top right.  This is useful to change/fix/save specs.

It's also useful because this is the format LLMs can provide specifications for a stage layout.  Under the "AI Prompt Generator" section you can give a prompt, and the system will add some context to it and copy the resulting prompt to the clipboard.. you can pass it to ChatGPT or something to get a JSON board to use, which tends to be easier to get started making a stage.

Here's an example prompt and resulting JSON (from ChatGPT 4o):

Prompt:
*create a 3 meter by 6 meter room, all four walls mirrors, with the viewer centered horizontally, in the bottom third, and the bunny in the middle. The viewer looks up slightly so that the ray a ray emitting from the viewer will bounce off the right mirror then the left before striking the bunny in the middle.  Place a phantom along the line the viewer is looking, about 3 meters along that line. Place another phantom 1 meter right of the righthand mirror, at the same vertical position as the bunny*

Board Spec:
```
{
  "version": "1.0",
  "worldSize": {
    "width": 15,
    "height": 10
  },
  "components": [
    {
      "id": "mirror_top",
      "type": "mirror",
      "position": { "x": 7.5, "y": 2 },
      "orientation": 0,
      "length": 3
    },
    {
      "id": "mirror_bottom",
      "type": "mirror",
      "position": { "x": 7.5, "y": 8 },
      "orientation": 0,
      "length": 3
    },
    {
      "id": "mirror_left",
      "type": "mirror",
      "position": { "x": 6, "y": 5 },
      "orientation": 1.5708,
      "length": 6
    },
    {
      "id": "mirror_right",
      "type": "mirror",
      "position": { "x": 9, "y": 5 },
      "orientation": 1.5708,
      "length": 6
    },
    {
      "id": "viewer1",
      "type": "viewer",
      "position": { "x": 7.5, "y": 6.7 },
      "orientation": 1.0472
    },
    {
      "id": "bunny1",
      "type": "bunny",
      "position": { "x": 7.5, "y": 5 }
    },
    {
      "id": "phantom1",
      "type": "phantom",
      "position": { "x": 9.0, "y": 4.1 }
    },
    {
      "id": "phantom2",
      "type": "phantom",
      "position": { "x": 10.0, "y": 5 }
    }
  ]
}
```