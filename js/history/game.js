	var camera, scene, renderer, fov;
	var geometry, material, mesh;
	var controls;
	var mass = 500;
	var delta;
	var fogLevel = 1500;

	var objects = [];

	var raycaster;

	var blocker = document.getElementById( 'blocker' );
	var instructions = document.getElementById( 'instructions' );

	// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	if ( havePointerLock ) {

		var element = document.body;

		var pointerlockchange = function ( event ) {

			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

				controlsEnabled = true;
				controls.enabled = true;

				blocker.style.display = 'none';

			} else {

				controls.enabled = false;

				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';

				instructions.style.display = '';

			}

		}

		var pointerlockerror = function ( event ) {

			instructions.style.display = '';

		}

		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		instructions.addEventListener( 'click', function ( event ) {

			instructions.style.display = 'none';

			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

			if ( /Firefox/i.test( navigator.userAgent ) ) {

				var fullscreenchange = function ( event ) {

					if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

						document.removeEventListener( 'fullscreenchange', fullscreenchange );
						document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

						element.requestPointerLock();
					}

				}

				document.addEventListener( 'fullscreenchange', fullscreenchange, false );
				document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

				element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

				element.requestFullscreen();

			} else {

				element.requestPointerLock();

			}

		}, false );

	} else {

		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

	}

	init();
	animate();

	var controlsEnabled = false;

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var isWalking = false;
	var doubleJump = false;
	var jumps = 0;
	var canJump;

	var prevTime = performance.now();
	var velocity = new THREE.Vector3();

	function init() {
		fov =  100;
		camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1000 );

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xffffff, 0, fogLevel );

		var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.1 );
		light.position.set( 0.5, 1, 0.75 );
		scene.add( light );

		controls = new THREE.PointerLockControls( camera );
		scene.add( controls.getObject() );

		// HANDLE KEY INTERACTION
		function handleKeyInteraction(keyCode, boolean) {
			var isKeyDown = boolean

			switch(keyCode) {
				case 16: // shiftKey
					isWalking = boolean;
					break
				case 38: // up
				case 87: // w
					moveForward = boolean;
					break;

				case 37: // left
				case 65: // a
					moveLeft = boolean;
					break;

				case 40: // down
				case 83: // s
					moveBackward = boolean;
					break;

				case 39: // right
				case 68: // d
					moveRight = boolean;
					break;

				case 32: // space
					console.log(isKeyDown, "key was down")

					if ( canJump === true && isKeyDown ) {
						console.log("KEYPRESS", jumps)
						console.log("First Jump");
						velocity.y += 350;
						canJump = false;
						jumps += 1;
					}
					else if ( doubleJump === true && isKeyDown ) {
						console.log("KEYPRESS", jumps)
						console.log("Double Jump");
						velocity.y += 350;
						jumps += 1;
					}
					break;
			}
		}

		var onKeyDown = function ( event ) { handleKeyInteraction(event.keyCode, true); };
		var onKeyUp = function ( event ) { handleKeyInteraction(event.keyCode, false); };
		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

		// floor

		geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
		geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

		for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

			var vertex = geometry.vertices[ i ];
			vertex.x += Math.random() * 20 - 10;
			vertex.y += Math.random() * 2;
			vertex.z += Math.random() * 20 - 10;

		}

		for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

			var face = geometry.faces[ i ];
			face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.5, 0.75, Math.random() * 0.25 + 0.5 );
			face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.1 );
			face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.8 + 0.5, 0.75, Math.random() * 0.25 + 1 );

		}

		material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

		mesh = new THREE.Mesh( geometry, material );
		scene.add( mesh );

		// objects

		geometry = new THREE.BoxGeometry( 20, 20, 20 );

		for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

			var face = geometry.faces[ i ];
			face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.1 + 0.5, 0.75, Math.random() * 0.15 + 0.5 );
			face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
			face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.35 + 0.75 );

		}

		for ( var i = 0; i < 500; i ++ ) {

			material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

			var mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
			mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 30;
			mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
			scene.add( mesh );

			material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

			objects.push( mesh );

		}

		//

		renderer = new THREE.WebGLRenderer({ antialisasing: true });
		renderer.setClearColor( 0xffffff );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		//

		window.addEventListener( 'resize', onWindowResize, false );

	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	function animate() {

		requestAnimationFrame( animate );

		if ( controlsEnabled ) {
			raycaster.ray.origin.copy( controls.getObject().position );
			raycaster.ray.origin.y -= 10;

			var intersections = raycaster.intersectObjects( objects );

			var isOnObject = intersections.length > 0;
			var isOnFloor = controls.getObject().position.y < 10 ;
			var time = performance.now();

			// Is walking?
			var delta = (isWalking) ? ( time - prevTime ) / 2000 : ( time - prevTime ) / 1000;

			velocity.x -= velocity.x * 10.0 * delta;
			velocity.z -= velocity.z * 10.0 * delta;
			velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

			// Movements
			if ( moveForward ) velocity.z -= mass * delta;
			if ( moveBackward ) velocity.z += mass * delta;
			if ( moveLeft ) velocity.x -= mass * delta;
			if ( moveRight ) velocity.x += mass * delta;

			// Is on an object
			if ( isOnObject === true ) {
				velocity.y = Math.max( 0, velocity.y );
				jumps = 0;
				canJump = true;
			}

			// Has hit the ground
			if ( isOnFloor === true ) {
				velocity.y = 0;
				controls.getObject().position.y = 10;
				canJump = true;
				jumps = 0;
			}

			if (!canJump && jumps === 1) {
				doubleJump = true;
			}

			// Velocity movement
			controls.getObject().translateX( velocity.x * delta );
			controls.getObject().translateY( velocity.y * delta );
			controls.getObject().translateZ( velocity.z * delta );

			// End of render loop
			prevTime = time;

		}

		renderer.render( scene, camera );

	}
