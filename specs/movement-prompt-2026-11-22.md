Treat this as a detailed instruction to improve the movement, animation, physical interactions and overall feel of this game. Act as an experienced game animator, gameplay programmer and mobile game developer.

If the game already exists, inspect its implementation and make the improvements directly. If you are building it now, apply these standards from the beginning. Work through the important problems systematically, then play through the result and refine it.

Preserve the game’s intended style: make a 2D game excellent in 2D and a 3D game excellent in 3D. Aim for believable, coherent movement within that style. Keep controls responsive and gameplay enjoyable.

1. Understand what is moving before animating it.
   
   Identify the game’s characters, creatures, vehicles, projectiles, equipment, surfaces and boundaries. Decide how each should move, what it can interact with and what should happen during contact.
   
   Apply behaviour appropriate to the subject. A person, tank, cockroach, horse, ship and bouncing ball should each have distinct movement. Use the game’s existing rules and infer sensible defaults where details are missing.

2. Make the main action feel good first.
   
   Identify what the player does most frequently: running, swinging a racket, jumping, steering, climbing, pouring or something else. Improve that action before adding decorative effects.
   
   Input should produce an immediate visible response. Actions with deliberate preparation, such as a powerful swing, should begin responding immediately even if the action takes time to complete.

3. Build coherent movement states and transitions.
   
   Give moving actors appropriate states, such as idle, starting, moving, turning, braking, jumping, falling, landing, acting, reacting and recovering.
   
   Blend transitions where possible. Prevent conflicting actions: a character should not simultaneously run normally, fall and celebrate. Make interruptions behave sensibly, including being hit during another action.
   
   Keep animation speed consistent with actual movement. Characters should not sprint visually while barely travelling or slide across the ground with motionless feet.

4. Make bodies move with believable weight and anatomy.
   
   For human characters, coordinate hips, torso, shoulders, arms and legs. Show weight shifting before a strong action, leaning during acceleration and turns, and compression when landing.
   
   Keep feet planted during supporting phases where the available animation system permits. Avoid limbs passing through bodies, impossible joint bends and sudden unexplained changes of pose.
   
   For creatures, use their own body structure and movement pattern. For vehicles, show appropriate wheel or track movement, suspension, banking or hull response.
   
   Use existing animation clips and rigs where available. If detailed assets are missing, implement the strongest achievable procedural movement and identify the remaining asset limitation accurately.

5. Improve timing throughout each action.
   
   Give important actions a readable preparation, execution, contact, follow-through and recovery.
   
   Examples:
   
   - A tennis player prepares the racket, swings through the ball and follows through.
   - A basketball player gathers the ball, raises it, releases it and completes the arm movement.
   - A wrestler plants their feet before a shove and reacts to resistance.
   - A climber shifts their weight before releasing a supporting hand.
   
   Keep these movements brief enough to preserve responsive play. Use easing appropriate to the action; impacts can be abrupt, while settling and recovery usually take longer.

6. Synchronise animation with the actual gameplay event.
   
   Release balls and projectiles from the correct hand, tool or weapon at the correct moment. Align contact sounds, recoil, particles, damage and vibration with the moment of contact.
   
   A racket should meet the ball where the strike occurs. A foot should connect with a football when it is kicked. A held object should follow the hand until released.
   
   Prevent duplicate hits from one continuous contact. Make each successful interaction produce one consistent result.

7. Make boundaries and collision shapes match the visible world.
   
   Inspect playable areas, floors, walls, platforms, water, ceilings and interactive objects. Give them appropriate collision behaviour.
   
   Account for the full size of the character or object. Do not allow half a body to pass through a wall because only its centre is checked.
   
   Distinguish boundaries by purpose:
   
   - A solid wall blocks movement.
   - A platform edge can permit a fall.
   - A court line can define an out-of-bounds event.
   - Water can trigger swimming, a splash or a restart.
   - A background object may be decorative.
   
   Apply the intended rules rather than treating every visible edge identically.

8. Respect the specific game’s spatial rules.
   
   In sports, a ball may legitimately travel out of bounds; detect and resolve that event instead of invisibly bouncing it back into play. Restrict players and equipment according to the intended rules.
   
   In obstacle games, moving platforms should carry the player naturally, and successful jumps should end on the visible surface.
   
   In driving or sailing games, allow sensible contact, sliding or obstruction according to the environment. Prevent characters and vehicles becoming permanently stuck at corners.
   
   Test edges, corners, narrow passages, fast movement and interactions between moving objects.

9. Use consistent physics and stable simulation.
   
   Make speed, acceleration, gravity, momentum, friction, bounce and drag appropriate to each object. Heavy objects should feel heavy through acceleration, stopping distance and reactions.
   
   Make simulation independent of rendering frame rate. Use suitable physics steps and collision detection so fast objects do not pass through thin obstacles.
   
   Keep the visible object and its gameplay position synchronised. Avoid floating above surfaces, sinking into floors, jittering at rest or teleporting after collisions.
   
   Preserve intentional arcade behaviour while making its rules consistent and learnable.

10. Make contact and reactions convincing.
    
    Scale reactions to the event’s strength and direction. A glancing hit should look different from a direct collision. A small landing should differ from a heavy fall.
    
    Show resistance where appropriate: a wrestler pushing another wrestler, a tyre gripping the ground or a board cutting through water.
    
    Use controlled animation during normal play and loose ragdoll movement where a fall or defeat calls for it. Ensure reactions do not repeatedly take control away from the player.

11. Use phone vibration with judgement.
    
    Choose vibration according to meaningful gameplay events.
    
    - Use light, brief feedback for small interactions when it adds useful physical sensation.
    - Use stronger, brief feedback for substantial impacts, heavy landings, firing powerful equipment or taking a significant hit.
    - Give different important events distinguishable patterns where supported.
    - Keep quiet, delicate or relaxing activities appropriately subtle.
    
    Trigger vibration from the gameplay event, once per event. Prevent overlapping pulses and rapid repeated vibration from collision callbacks.
    
    Provide an off setting and intensity options where supported. Detect the platform’s available haptic capabilities and continue normally when vibration is unavailable. Verify whether it actually works in the target environment.

12. Improve the camera’s contribution to movement.
    
    Keep the player, relevant hazards and intended destination visible. Follow smoothly while avoiding excessive lag.
    
    Frame sports so the ball, opponent and useful playing area remain readable. Frame jumps so landing surfaces can be judged. In 3D, prevent the camera passing through scenery or becoming trapped behind objects.
    
    Use shake sparingly for substantial events, with a reduced-motion option. Maintain a stable horizon where appropriate. Camera effects should preserve the player’s ability to judge movement.

13. Connect sound and visual feedback to physical events.
    
    Match footsteps to foot contact, impact sounds to collisions and tool sounds to actual operation. Vary sounds appropriately for surfaces and materials.
    
    Use dust, splashes, footprints, trails, recoil and deformation selectively to explain movement and contact. Make effect intensity proportional to the event.
    
    Keep essential objects and hazards clearly visible through all effects. Judge the underlying movement with decorative effects temporarily disabled as well.

14. Make computer-controlled actors physically coherent.
    
    Opponents and teammates should obey movement, collision and action constraints consistent with the game. They should turn, accelerate, prepare actions and recover rather than teleport or snap into place.
    
    Give them readable intentions and suitable reactions. Sports players should move into useful positions, track the ball and attempt actions when they can reach it. Enemies should navigate around obstacles.
    
    Make difficulty come from skill, timing and decisions within these rules.

15. Keep the result smooth on phones.
    
    Target smooth, stable performance on ordinary mobile devices. Use efficient animation updates, suitable model complexity and sensible limits on effects and physics.
    
    Prioritise clear movement and responsive controls when performance is constrained. Scale decorative detail before sacrificing the main action.
    
    Make touch targets comfortable and support simultaneous inputs where gameplay requires them. Correctly handle releasing a finger, interrupted touches, pausing, restarting and returning from the background.

16. Verify the improvements through actual play.
    
    Inspect the current technology and use the tools already available before introducing dependencies. Work through movement, collision correctness and action timing first, then refine feedback and presentation.
    
    Test ordinary play and awkward situations: moving against a wall, turning while acting, landing near an edge, repeated inputs, collisions during animations, low frame rates and restarting during an action. Apply only the checks relevant to this game.
    
    Where you can run and interact with the game, do so. Watch complete movement sequences and correct visible problems. Where testing requires a real phone or unavailable tools, clearly identify what remains unverified.
    
    Finish with a short report explaining what you changed, what you tested and any specific animation assets or platform capabilities still needed. Deliver the improved game alongside that report.

Use these instructions selectively and intelligently for this game. Preserve its intended pacing, atmosphere, difficulty and win or loss rules. The goal is that movement, contact, sound, camera behaviour and vibration all feel like parts of one coherent experience.