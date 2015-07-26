



	var camera, scene, renderer;
	var geometry, material, mesh;
	var controls;

	var objects = [];

	var raycaster;
	var upRay;
	var downRay;
	var backRay;
	var forwardRay;
	var leftRay;
	var rightRay;

	var controlsEnabled = false;
	var time;
	var delta;
	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var isSlowMo = false;
	var mass = 100;
	var lightIntensity = 0.15;
	var fog = 700 // Higher = less fog
	var jumpFactor = 120;
	var jumps = 0;
	var slowMo = 4000; // Higher = slower
	var speed = 900;
	var canJump;
	var doubleJump;
	var rotationMatrix;

	var isBehindObject;
	var isInfrontObject;
	var isOnObject;
	var isOnGround;
	var lockMoveForward = false;
	var lockMoveLeft = false;
	var lockMoveRight = false;
	var lockMoveBackward = false;

	var timer;

	init();
	animate();

	var prevTime = performance.now();
	var velocity = new THREE.Vector3();


	function init() {

		var sec = 0;
		function pad ( val ) { return val > 9 ? val : "0" + val; }

		timer = setInterval( function(){
			$("#seconds").html(pad(++sec%60));
			$("#minutes").html(pad(parseInt(sec/60,10)));
		}, 1000);

		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 8000 );

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xffffff, 0, fog + 1000 );

		// var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, lightIntensity );
		// light.position.set( 0.5, 1, 0.75 );
		// scene.add( light );

		controls = new THREE.PointerLockControls( camera );
		scene.add( controls.getObject() );

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
					var doubleJump = (!canJump && jumps === 1);
					if ( canJump === true && isKeyDown ) {
						velocity.y += jumpFactor * 2.25;
						canJump = false;
						jumps = 1;
					}
					if ( doubleJump === true && isKeyDown ) {
					 	velocity.y += jumpFactor * 1.75;
						jumps = 2;
					}
					break;

			}
		}

		// RayCaster
		downwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
		upwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 1, 0 ), 0, 14 );
		forwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, 15 );
		backwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 );
		leftRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 );
		rightRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 );
		rightStrafeRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 30 );
		leftStrafeRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 30 );


		// Floor
		var height = 6000
		geometry = new THREE.SphereGeometry(height, 8, 6, 0, (Math.PI * 2), 0, 0.5);
		geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -height, 0) );

		var texture = new THREE.ImageUtils.loadTexture("img/cc/moon2.jpg");
		var material = new THREE.MeshBasicMaterial( {map:texture} );

		mesh = new THREE.Mesh( geometry, material );
		scene.add( mesh );

		// objects

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
			scene.add( boxmesh );

			//material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

			objects.push( boxmesh );

		}

		// Sky

		var pwd = window.location.href.substring(0, window.location.href.indexOf('/'));
		var sky = new THREE.SphereGeometry(6000, 80, 80); // radius, widthSegments, heightSegments
		var uniforms = {
		  texture: { type: 't', value: THREE.ImageUtils.loadTexture(pwd + 'img/cc/galaxy3.jpg') }
		};

		var material = new THREE.ShaderMaterial( {
		  uniforms:       uniforms,
		  vertexShader:   document.getElementById('sky-vertex').textContent,
		  fragmentShader: document.getElementById('sky-fragment').textContent
		});

		skyBox = new THREE.Mesh(sky, material);
		skyBox.scale.set(-1, 1, 1);
		skyBox.eulerOrder = 'XZY';
		skyBox.renderDepth = 1000.0;
		scene.add(skyBox);

		renderer = new THREE.WebGLRenderer({ antialias: true }); //new THREE.WebGLRenderer();
		renderer.setClearColor( 0xffffff );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		console.log(renderer.domElement)

		$("body").mousedown(function(event) {
			console.log(event);
			if (event.which == 3) { speed = 400; console.log("mouseclick 2") }
			if (event.which == 1 ) { isSlowMo = true; }
		});
		$("body").mouseup(function(event) {
			if (event.which == 3 ) { speed = 900; }
			if (event.which == 1 ) { isSlowMo = false; }
		});

		var onKeyDown = function ( event ) { handleKeyInteraction(event.keyCode, true); };
		var onKeyUp = function ( event ) { handleKeyInteraction(event.keyCode, false); };
		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		// Resize Event
		window.addEventListener( 'resize', onWindowResize, false );

	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	var first = 1;
	function animate() {

		requestAnimationFrame( animate );

		if ( controlsEnabled ) {

			var time = performance.now();

			// Is Walking?
			var delta = (isSlowMo) ? ( time - prevTime ) / slowMo : ( time - prevTime ) / speed;
			//console.log(speed)

			// Velocities
			velocity.x -= velocity.x * 8.0 * delta; // Left and right
			velocity.z -= velocity.z * 8.0 * delta; // Forward and back
			velocity.y -= (isSlowMo) ?  9.8 * mass * delta : 5.5 * mass * delta;  // Up and Down

			lockMoveForward = false;
			lockMoveBackward = false;
			lockMoveLeft = false;
			lockMoveRight = false;

			camDir = camera.getWorldDirection().clone().setX(1.0);
			if (first === 150) {
				console.log(camDir);
			}
			first +=1;
			playersPosition = controls.getObject().position.clone();
			if (playersPosition.y > 1340) {
				console.log("BEEP");
				$(".timertext").css("color","red");
				clearInterval(timer);

			  }
			upwardsRaycaster.ray.origin.copy(playersPosition);
			downwardsRaycaster.ray.origin.copy(playersPosition);
			forwardsRaycaster.ray.set(playersPosition, camDir);
			backwardsRaycaster.ray.set(playersPosition, camDir.negate());
			leftRaycaster.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(- (Math.PI / 2) )));
			rightRaycaster.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY( Math.PI )));
			rightStrafeRaycaster.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(  (Math.PI / 4) ))); // Working
			leftStrafeRaycaster.ray.set(playersPosition, camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(  (Math.PI / 4) )));

			downwardsIntersection = downwardsRaycaster.intersectObjects( objects );
			upwardsIntersection = upwardsRaycaster.intersectObjects( objects );
			forwardsIntersection = forwardsRaycaster.intersectObjects( objects );
			backwardsIntersection = backwardsRaycaster.intersectObjects( objects );
			leftIntersection = leftRaycaster.intersectObjects( objects );
			rightIntersection = rightRaycaster.intersectObjects( objects );
			rightStrafeIntersection = rightStrafeRaycaster.intersectObjects( objects );
			leftStrafeIntersection = leftStrafeRaycaster.intersectObjects( objects );

			isRightStafeOfObject = rightStrafeIntersection.length > 0;
			if (isRightStafeOfObject) { lockMoveRight = true; lockMoveFoward = true; }

			isLeftStafeOfObject = leftStrafeIntersection.length > 0;
			if (isLeftStafeOfObject) { lockMoveLeft = true; lockMoveFoward = true; }

			isLeftOfObject = leftIntersection.length > 0;
			if (isLeftOfObject) { lockMoveLeft = true; }

			isRightOfObject = rightIntersection.length > 0;
			if (isRightOfObject) { lockMoveRight = true; }

			isInfrontObject = forwardsIntersection.length > 0;
			if (isInfrontObject) { lockMoveForward = true; } //console.log("inFront")}

			isBehindObject = backwardsIntersection.length > 0;
			if (isBehindObject) { lockMoveBackward = true; } //console.log("behind")}

			isOnObject = downwardsIntersection.length > 0;
			if ( isOnObject === true ) {
				velocity.y = Math.max( 0, velocity.y );
				jumps = 0;
				canJump = true;
			}

			// If your head hits an object, turn your mass up to make you fall back to earth
			isBelowObject = upwardsIntersection.length > 0;
			if ( isBelowObject === true ) { mass = 300; }
			else { mass = 100; }

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

			// Is on ground
			var isOnGround = controls.getObject().position.y < 10;
			if ( isOnGround ) {
				velocity.y = 0;
				controls.getObject().position.y = 10;
				jumps = 0;
				canJump = true;
			}


			prevTime = time;

		}

		renderer.render( scene, camera );

	}
