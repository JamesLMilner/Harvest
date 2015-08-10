var Harvest = (function () {

  // Instance stores a reference to the Singleton
  var instance;

  function startGame() {

    // Singleton

	var camera, scene, renderer;
	var geometry, material, mesh;
	var controls;
	var boxes = [];
	var objects = [];

	var raycaster;
	var upRay;
	var downRay;
	var backRay;
	var forwardRay;
	var leftRay;
	var rightRay;
	var WON = false;

	var controlsEnabled = false;
	var time;
	var delta;
	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var isSlowMo = false;
	var mass = 100;
	var originalMass = mass;
	var lightIntensity = 0.15;
	var fog = 700 // Higher = less fog
	var jumpFactor = 120;
	var jumps = 0;
	var slowMo = 4000; // Higher = slower
	var speed = 900;
	var firstJump;
	var rotationMatrix;

	var timer;
	var isBehindObject;
	var isInfrontObject;
	var isOnObject;
	var isOnGround;
	var lockMoveForward = false;
	var lockMoveLeft = false;
	var lockMoveRight = false;
	var lockMoveBackward = false;

	init();
	animate();

	var prevTime = performance.now();
	var velocity = new THREE.Vector3();


	function init() {

		initialiseTimer();
		eventHandlers();
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xffffff, 0, fog + 1000 );

		// Sky
		var ranTexture = randomTexture(4)
		var pwd = window.location.href.substring(0, window.location.href.indexOf('/'));
		var sky = new THREE.SphereGeometry(8000, 32, 32); // radius, widthSegments, heightSegments
		var uniforms = {
		  texture: { type: 't', value: THREE.ImageUtils.loadTexture(pwd + 'img/cc/galaxy' + randomTexture(3) + '.jpg') }
		};

		var skyMaterial = new THREE.ShaderMaterial( {
			uniforms:       uniforms,
			vertexShader:   document.getElementById('sky-vertex').textContent,
			fragmentShader: document.getElementById('sky-fragment').textContent
		});

		skyBox = new THREE.Mesh(sky, skyMaterial);
		skyBox.scale.set(-1, 1, 1);
		skyBox.eulerOrder = 'XZY';
		skyBox.renderDepth = 1000.0;
		scene.add(skyBox);

		// RayCaster
		raycasters = {

			down : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 20 ),
			up : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 1, 0 ), 0, 20 ),
			forward : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, 15 ),
			backward : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 ),
			left : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 ),
			right : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 ),
			rightStrafe : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 30 ),
			leftStrafe : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 30 ),

		}

		// Floor
		var floorHeight = 7000
		geometry = new THREE.SphereGeometry(floorHeight, 10, 6, 0, (Math.PI * 2), 0, 0.8);
		geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -floorHeight, 0) );

		var texture = new THREE.ImageUtils.loadTexture("img/cc/moon" + randomTexture(3)  +".jpg");
		var material = new THREE.MeshBasicMaterial( {map:texture} );

		floorMesh = new THREE.Mesh( geometry, material );
		objects.push( floorMesh );
		scene.add( floorMesh  );

		// Boxes
		var boxGeometry = new THREE.BoxGeometry( 20, 20, 20 );
		var boxTexture1 = new THREE.ImageUtils.loadTexture("img/cc/block1.jpg");
		var boxTexture2 = new THREE.ImageUtils.loadTexture("img/cc/block2.jpg");
		var boxTexture3 = new THREE.ImageUtils.loadTexture("img/cc/block3.jpg");
		var boxTexture4 = new THREE.ImageUtils.loadTexture("img/cc/block4.jpg");
		var boxMaterial1 = new THREE.MeshBasicMaterial( {map: boxTexture1, reflectivity: 0.8} );
		var boxMaterial2 = new THREE.MeshBasicMaterial( {map: boxTexture2, reflectivity: 0.8} );
		var boxMaterial3 = new THREE.MeshBasicMaterial( {map: boxTexture3, reflectivity: 0.8} );
		var boxMaterial4 = new THREE.MeshBasicMaterial( {map: boxTexture4, reflectivity: 0.8} );
		var items = [boxMaterial1 ,boxMaterial2, boxMaterial3, boxMaterial4]
		var boxZ;
		for ( var i = 0; i < 850; i ++ ) {

			//material = new THREE.MeshBasicMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
			items[Math.floor(Math.random()*items.length)];
			var boxmesh = new THREE.Mesh( boxGeometry, items[Math.floor(Math.random()*items.length)] );

			boxZ = 70;
			boxmesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
			boxmesh.position.y = Math.floor( Math.random() * 20 ) * boxZ + 10;
			boxmesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

			boxes.push( boxmesh );
			objects.push( boxmesh );
			scene.add( boxmesh );
		}


		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 9000 );
		controls = new THREE.PointerLockControls( camera );
		scene.add( controls.getObject() );

		renderer = new THREE.WebGLRenderer({ antialias: true }); //new THREE.WebGLRenderer();
		renderer.setClearColor( 0xffffff );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		ScreenOverlay(controls); //
		document.body.appendChild( renderer.domElement );

	}

	function animate() {

		requestAnimationFrame( animate );

		if ( controls.enabled ) {

			time = performance.now();

			// Is Walking?
			delta = (isSlowMo) ? ( time - prevTime ) / slowMo : ( time - prevTime ) / speed;

			// Velocities
			velocity.x -= velocity.x * 8.0 * delta; // Left and right
			velocity.z -= velocity.z * 8.0 * delta; // Forward and back
			velocity.y -= (isSlowMo) ?  9.8 * mass * delta : 5.5 * mass * delta;  // Up and Down

			unlockMovement();

			camDir = controls.getObject().getWorldDirection().negate(); //
			playersPosition = controls.getObject().position.clone();

			raycasters.up.ray.origin.copy(playersPosition);
			raycasters.down.ray.origin.copy(playersPosition);
			raycasters.forward.ray.set(playersPosition, camDir);
			raycasters.backward.ray.set(playersPosition, camDir.negate());
			raycasters.left.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(- (Math.PI / 2) )));
			raycasters.right.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY( Math.PI )));
			raycasters.rightStrafe.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(  (Math.PI / 4) ))); // Working
			raycasters.leftStrafe.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(  (Math.PI / 4) )));

			upwardsIntersection = raycasters.up.intersectObjects( objects );
			downwardsIntersection = raycasters.down.intersectObjects( objects );
			forwardsIntersection = raycasters.forward.intersectObjects( objects );
			backwardsIntersection = raycasters.backward.intersectObjects( objects );
			leftIntersection = raycasters.left.intersectObjects( objects );
			rightIntersection = raycasters.right.intersectObjects( objects );
			rightStrafeIntersection = raycasters.rightStrafe.intersectObjects( objects );
			leftStrafeIntersection = raycasters.leftStrafe.intersectObjects( objects );

			isRightStafeOfObject = rightStrafeIntersection.length > 0;
			if (isRightStafeOfObject) { lockMoveRight = true; lockMoveFoward = true; }

			isLeftStafeOfObject = leftStrafeIntersection.length > 0;
			if (isLeftStafeOfObject) { lockMoveLeft = true; lockMoveFoward = true; }

			isLeftOfObject = leftIntersection.length > 0;
			if (isLeftOfObject) { lockMoveLeft = true; }

			isRightOfObject = rightIntersection.length > 0;
			if (isRightOfObject) { lockMoveRight = true; }

			isInfrontObject = forwardsIntersection.length > 0;
			if (isInfrontObject) { lockMoveForward = true; }

			isBehindObject = backwardsIntersection.length > 0;
			if (isBehindObject) { lockMoveBackward = true; } //console.log("behind")}

			// If your head hits an object, turn your mass up to make you fall back to earth
			isBelowObject = upwardsIntersection.length > 0;
			if ( isBelowObject === true ) { mass = 600; }
			else { mass = originalMass; }

			// Jumping - must come after isBelowObject but before isOnObject
			if (jumps === 1 && firstJump && !isBelowObject) {
				velocity.y += jumpFactor * 2.50;
				firstJump = false;
			}
			if (jumps === 2 && !firstJump && !isBelowObject) {
				velocity.y += jumpFactor * 2.00;
				jumps = 3;
			}

			isOnObject = downwardsIntersection.length > 0;
			if ( isOnObject === true ) {
				velocity.y = Math.max( 0, velocity.y );
				jumps = 0;
				canSingleJump = true;
				if (controls.getObject().position.y < 10) {
					//controls.getObject().position.y += 0.00000001;
				}
			}

			// Movements
			if ( moveForward && !isSlowMo && !lockMoveForward) velocity.z -= 400.0 * delta;
			if ( moveForward && isSlowMo && !lockMoveForward) velocity.z -= 1000.0 * delta;
			if ( moveBackward && !lockMoveBackward ) velocity.z += 400.0 * delta;
			if ( moveLeft && !lockMoveLeft ) velocity.x -= 400.0 * delta;
			if ( moveRight && !lockMoveRight ) velocity.x += 400.0 * delta;

			// Velocity translations
			controls.getObject().translateX( velocity.x * delta );
			controls.getObject().translateY( velocity.y * delta );
			controls.getObject().translateZ( velocity.z * delta );

			//Check if player has completed the game
			if (playersPosition.y > 1350 && !WON) {
				gameWon();
			}

			prevTime = time;
		}
		renderer.render( scene, camera );

	}

	function randomTexture(maxTextures) {
		return Math.floor(Math.random() * maxTextures) + 1
	}

	function unlockMovement() {
		lockMoveForward = false;
		lockMoveBackward = false;
		lockMoveLeft = false;
		lockMoveRight = false;
	}

	function initialiseTimer() {
		var sec = 0;
		function pad ( val ) { return val > 9 ? val : "0" + val; }

		timer = setInterval( function(){
			$("#seconds").html(pad(++sec%60));
			$("#minutes").html(pad(parseInt(sec/60,10)));
		}, 1000);
	}

	function eventHandlers() {

		// Right and Left Click handlers
		$("body").mousedown(function(event) {
			if (event.which == 3) { speed = 400; }
			if (event.which == 1 ) { isSlowMo = true; }
		});
		$("body").mouseup(function(event) {
			if (event.which == 3 ) { speed = 900; }
			if (event.which == 1 ) { isSlowMo = false; }
		});

		// Keyboard press handlers
		var onKeyDown = function ( event ) { handleKeyInteraction(event.keyCode, true); };
		var onKeyUp = function ( event ) { handleKeyInteraction(event.keyCode, false); };
		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		// Resize Event
		window.addEventListener( 'resize', onWindowResize, false );
	}

	// HANDLE KEY INTERACTION
	function handleKeyInteraction(keyCode, boolean) {
		var isKeyDown = boolean;
		switch(keyCode) {
			case 38: // up
			case 87: // w
				moveForward = boolean;
				break;

			case 40: // down
			case 83: // s
				moveBackward = boolean;
				break;

			case 37: // left
			case 65: // a
				moveLeft = boolean;
				break;

			case 39: // right
			case 68: // d
				moveRight = boolean;
				break;

			case 32: // space
				if (jumps === 0 && !isKeyDown) {
					jumps = 1;
				}
				if (jumps === 1 && !isKeyDown) {
					jumps = 2;
				}
				break;
		}
	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	function gameWon() {
		WON = true;
		async.forEachOf(boxes, function(box, i, callback) {
			var fallingMotion = 0;
			var boxPos = box.position.y
			for (var pos = boxPos ; pos > 0; pos -= 5) {
				fallingMotion += 15;
				fallingBoxes(box, pos, fallingMotion);
			};
		});
		$(".timertext").css("color","red");
		clearInterval(timer);
	}

	function fallingBoxes(cube, pos, delay) {
		//console.log(cube,pos,delay)
		setTimeout(function() { cube.position.setY(pos); }, delay);
	}

    return {
		// Public methods and variables
		setFog: function (setFog) {
			fog = setFog;
		},
		setJumpFactor: function (setJumpFactor) {
			jumpFactor = setJumpFactor;
		}

    };

  };

  return {

    // Get the Singleton instance if one exists
    // or create one if it doesn't
    getInstance: function () {

      if ( !instance ) {
        instance = startGame();
      }

      return instance;
    }

  };

})();

harvest = Harvest.getInstance();
