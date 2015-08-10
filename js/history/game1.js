
	var camera, scene, renderer;
	var geometry, material, mesh;
	var controls;

	var objects = [];

	var raycaster;
	var floorRaycaster;
	var downwardsRaycaster;
	var forwardsRaycaster;

	var controlsEnabled = false;

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var isWalking = false;
	var mass = 100;
	var lightIntensity = 0.15;
	var fog = 750 // Higher = less fog
	var jumpFactor = 120;
	var jumps = 0;
	var slowMo = 4000; // Higher = slower
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

	init();
	animate();

	var prevTime = performance.now();
	var velocity = new THREE.Vector3();


	function init() {

		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 4000 );

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xffffff, 0, fog + 1000 );

		// var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, lightIntensity );
		// light.position.set( 0.5, 1, 0.75 );
		// scene.add( light );

		controls = new THREE.PointerLockControls( camera );
		rotationMatrix = new THREE.Matrix4();
		scene.add( controls.getObject() );

		// HANDLE KEY INTERACTION
		function handleKeyInteraction(keyCode, boolean) {
			var isKeyDown = boolean;
			switch(keyCode) {
				case 16: // shiftKey
					isWalking = boolean;
					break;
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

		var onKeyDown = function ( event ) { handleKeyInteraction(event.keyCode, true); };
		var onKeyUp = function ( event ) { handleKeyInteraction(event.keyCode, false); };
		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		downwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
		upwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 1, 0 ), 0, 10 );
		forwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, 8 );
		backwardsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 8 );
		leftRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 3 );


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
			face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.1 + 0.45 );
			face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.2 + 0.65 );
			face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.3 + 0.85 );

		}

		material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

		mesh = new THREE.Mesh( geometry, material );
		scene.add( mesh );

		// objects

		geometry = new THREE.BoxGeometry( 20, 20, 20 );

		for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

			var face = geometry.faces[ i ];
			face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.1, Math.random() * 0.25 + 0.10 );
			face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.1, Math.random() * 0.25 + 0.10 );
			face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.1, Math.random() * 0.25 + 0.10 );

		}

		for ( var i = 0; i < 500; i ++ ) {

			material = new THREE.MeshBasicMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

			var mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
			mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
			mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
			scene.add( mesh );

			material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

			objects.push( mesh );

		}

		// SkyBox

		// // Add Sky Mesh
		// var sky = new THREE.Sky();
		// scene.add( sky.mesh );
		//
		// // Add Sun Helper
		// var sunSphere = new THREE.Mesh( new THREE.SphereGeometry( 20000, 30, 30 ),
		// 						    new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: false }));
		// sunSphere.position.y = -700000;
		// sunSphere.visible = true;
		// scene.add( sunSphere );

		var pwd = window.location.href.substring(0, window.location.href.indexOf('/'));
		var sky = new THREE.SphereGeometry(3000, 60, 40);
		var uniforms = {
		  texture: { type: 't', value: THREE.ImageUtils.loadTexture(pwd + 'img/galaxy.jpg') }
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

			var time = performance.now();

			// Is Walking?
			var delta = (isWalking) ? ( time - prevTime ) / slowMo : ( time - prevTime ) / 900;

			// Velocities
			velocity.x -= velocity.x * 8.0 * delta;
			velocity.z -= velocity.z * 8.0 * delta;
			velocity.y -= 9.8 * mass * delta; // 100.0 = mass

			lockMoveForward = false;
			lockMoveBackward = false;
			lockMoveLeft = false;
			lockMoveRight = false;

			playersPosition = controls.getObject().position.clone();
			upwardsRaycaster.ray.origin.copy(playersPosition);
			downwardsRaycaster.ray.origin.copy(playersPosition);
			forwardsRaycaster.ray.set(playersPosition, camera.getWorldDirection());
			backwardsRaycaster.ray.set(playersPosition, camera.getWorldDirection().negate());

			//floorRaycaster.ray.origin.y -= 10;

			downwardsIntersection = downwardsRaycaster.intersectObjects( objects );
			upwardsIntersection = upwardsRaycaster.intersectObjects( objects );
			forwardsIntersection = forwardsRaycaster.intersectObjects( objects );
			backwardsIntersection = backwardsRaycaster.intersectObjects( objects );

			isBelowObject = upwardsIntersection.length > 0;
			isOnObject = downwardsIntersection.length > 0;

			isInfrontObject = forwardsIntersection.length > 0;
			if (isInfrontObject) { lockMoveForward = true; console.log("inFront")}
			else { lockMoveForward = false; }

			isBehindObject = backwardsIntersection.length > 0;
			if (isBehindObject) { lockMoveBackward = true; console.log("behind")}
			else { lockMoveBackward = false; }

			if ( isOnObject === true ) {
				velocity.y = Math.max( 0, velocity.y );
				jumps = 0;
				canJump = true;
			}

			// If your head hits an object, turn your mass up to make you fall back to earth
			if ( isBelowObject === true ) { mass = 300; }
			else { mass = 100; }

			// Movements
			if ( moveForward && !isWalking && !lockMoveForward) velocity.z -= 400.0 * delta;
			if ( moveForward && isWalking && !lockMoveForward) velocity.z -= 1000.0 * delta;
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
