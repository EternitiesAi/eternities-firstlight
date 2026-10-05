# Atlantis capture-blade01 swim stall

The demonstrated cause is the capture's four-direction controller, not an unsupported outlet or production collision defect. The preserved hardware report failed at `east_outlet_route_12_-38.4`; it records 149.337 seconds overall, no browser/console errors, unchanged source hashes and successful physical equalizer work. This review read the report and failure PNG and exercised a small CPU boundary regression; it did not run a browser or qualify ordinary RAF behavior.

At failure, the actual player is `(11.8142658356, -30.4759682854)` with feet `y=-1.40052`, camera yaw `0.76`, gallery mode active and time unpaused. The production east court wall is centered `(11.38,-34)`, width `.24`, depth `7`, with the production `.31` body clearance. Its expanded collision rectangle reaches **x=11.81** and z `[-37.81,-30.19]`; its vertical interval also intersects this body. The east lane remains supported between that wall and the gallery volume's body-safe **x=12.69** boundary. The declared outlet `(12,-1.4,-38.4)` is reachable there.

`capture_atlantis_campaign.py:188` converts the target correctly into camera coordinates but selects only one of four keys. At this point it selects W. Production `app.js:244` turns W into world direction `(-sin(.76),-cos(.76))`, entering the wall on the next step. `world-foundations.js:109-112` correctly refuses that horizontal move, retaining the supported position. The capture then chooses W again; the final recorded inputs are repeated W holds of 110 ms. Production provides no horizontal wall slide, and adding one is unnecessary for this route. The accepted shallow-current distance is unchanged between the quiet lower-band observation and the final failure; current/pull is not the demonstrated cause.

Use the staged **capture-only** `swim_keys(point,snapshot)` helper, which selects the nearest of eight headings using ordinary one-key or two-key WASD input. Here it returns W+D. The actual normalized production direction is approximately `(+0.0254,-0.9997)`, so it advances north while remaining outside the wall. Integrate this helper next to the existing helper and replace only the swimming line:

```python
# swim_to:238
keys.extend(swim_keys({'x': x, 'z': z}, d))
```

Keep `movement_key` returning a string: the dry combat approach at line 366 still calls `hold([movement_key(enemy,d)],140)`. No camera write, extra test flag, relocation, direct quest command, timeout increase or relaxed arrival tolerance is needed.

The four focused CPU tests pass (2.622 seconds). They compile the actual keyboard declaration and swim call from production app source and call the actual WorldFoundations collision code. Synthetic poses come from the preserved failure and last successful observations. The red control reproduces the old policy's 90-second stall; the proposed Python helper reaches the same outlet with the original `.14` horizontal / `.075` depth tolerances. W+D moves safely from the exact failure point, and all six remaining equalizer-to-outlet-to-landing waypoints retain actual body clearance. This exercises production math and geometry through a synthetic controller fixture, without DOM, browser, RAF, campaign progression or earned-play claims.

One evidence improvement is advisable: `swim_to` currently appends its trace only on success, so the failed waypoint's per-iteration positions were not saved. Append the observation and live trace before its loop, then mark it passed or failed with elapsed seconds. That changes capture reporting only and helps distinguish future focus, collision or timing faults. Existing report, PNG and raw footage remain immutable. A new ordinary-time capture is still required to establish this repair through native keyboard input on the RTX client.


Root integration: the list-returning helper is installed only for swimming. Existing string-returning combat movement remains. The capture now retains live traces from before each swim, including failed destinations. Portable CPU tests extract the actual installed helper and actual app keyboard transform, with explicitly labelled recorded boundary fixtures. Native857 and gameplay source epoch are unchanged; a new ordinary capture is required.
