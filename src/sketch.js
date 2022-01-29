//DEBUG VARIABLES
const DEVELOPER_MODE = false;
let clickedMousePositionX;
let collisionVisibility = false;
let selectedEntityType = 0;
let flipMode = false;


//GAME VARIABLES
let score = 0;
let lives = 3;
//Bool for turning gravity on and off.
let gravity = true;
let isPaused = false;
let wasPaused = false;
let isGameOver = false;
let pointInTime = 0;
//Variables for keeping track of screen dimensions.
let playAreaWidth = 600;
let uiAreaWidth = 200;
let canvasHeight = 700;
//Where the ball is placed at the beginning of the game and when the ball falls off the screen.
let ballStart = {
    x: undefined,
    y: undefined
};

//Text file containing list of credits for art & sound credits.
let creditTextFile;

//Game states.
//Possible game states:
//MENU, LOADING, GAME, LEADERBOARD
let currentGameState = 'MENU';

//Loading state variables.
let loadingTime = undefined;
let loadingText = undefined;

//Leaderboard
let leaderboardScores;

//GUI input element.
let rewindButton;
let rewindAudio;
let isRewinding = false;

/*
The entity class allows objects in the program to have a separate object for visually
representing the object in the sketch and a group of colliders for that object.
This allows for easily managing a visual sprite and its associated many possible colliders in the sketch.
It also enables keeping track of the type of entity so different behavior can happen in the event
of collision.
*/

class Entity
{
    constructor(sprite, collider, type)
    {
        this.sprite = sprite;
        this.collider = Group();
        /*
        If the inputted collider object is an array add each element of
        the array to the object's collider sprite group.
        If the inputted collider is a single object add that single object
        to the collider group.
        */
        if(Array.isArray(collider))
        {
            collider.forEach(element => {
                element.addToGroup(this.collider);
            });
        }
        else if(collider != null || collider != undefined)
        {
            collider.addToGroup(this.collider);
        }

        this.type = type;

        //Add all entities to this array.
        entities.push(this);
    }
}

//Shared paddle qualities.
const PADDLE_SPEED = 6;
//Lower number = more force
const PADDLE_FORCE = 35.0;
const PADDLE_MINIMUM_ANGLE = -46;
const PADDLE_MAXIMUM_ANGLE = 45;

class Paddle extends Entity
{
    constructor(positionX, positionY, flipped, size = 'BIG')
    {
        //Create paddle sprite using paddle image.
        let paddleSprite = createSprite(positionX, positionY);
        //The image is offset so that the sprite is centered on the paddle hinge.
        if(size == 'BIG')
        {
            paddleSprite.addImage(paddleImage);
        }
        else if('SMALL')
        {
            paddleSprite.addImage(smallPaddleImage);
        }

        //Set entity properties.
        super
        (
        paddleSprite,
        //Creating collider for paddle, the paddle length is half the paddle image width. 
        //This is because the image is offset meaning the left half of the paddle image is actually empty transparent space.
        createLineCollider(positionX, positionY, positionX + paddleSprite.width / 2, positionY),
        'PADDLE'
        );

        //Set paddle properties.
        this.angle = PADDLE_MAXIMUM_ANGLE;
        this.keyPressed = false;
        this.flipped = flipped;
        paddles.push(this);

        //If the paddle is flipped flip the paddle sprite;
        if(flipped)
        {
            this.sprite.mirrorY(-1);
        }
    }

    update()
    {
        /* Upate sprite and colliders to current paddle angle! */
        
        let realAngle = this.angle;
        //Fliip angle for paddles facing in the opposite direction.
        if(this.flipped)
        {
            realAngle = -this.angle - 180;
            //Set sprite rotation to Paddle angle.
            //Sprite rotation need to be flipped again because it is mirrored in the Y direction.
            this.sprite.rotation = -realAngle;
        }
        else
        {
            //Set sprite rotation to Paddle angle.
            this.sprite.rotation = realAngle;
        }        

        //Loop through each collider object of the paddle and change their x & y position to the corresponding position
        //in the direction of the paddle angle.
        for (let index = 0; index < this.collider.length; index++) 
        {
            const element = this.collider.get(index);

            element.position.x = this.sprite.position.x + cos(realAngle) * index * element.collider.radius;
            element.position.y = this.sprite.position.y + sin(realAngle) * index * element.collider.radius;
        }        
    }

    handleInput()
    {
        //If pandle key is pressed increase angle until maximum angle.
        //else degree angle until minimum angle.
        if(this.keyPressed && this.angle > PADDLE_MINIMUM_ANGLE)
        {
            this.angle -= PADDLE_SPEED;
            this.update();
            checkCollision();

        }
        else if(!this.keyPressed && this.angle < PADDLE_MAXIMUM_ANGLE)
        {
            this.angle += PADDLE_SPEED;
            this.update();
            checkCollision();
        }
    }
};

//Specific entites.
let ball;

//Pump launches the ball out of the starting area.
let pump = {
    box: undefined,
    end: undefined,
    endOffsetY: 0,
    force: 0,
    isBallHeld: false,
    keyPressed: false
};

//A floating platform. It is a single entity and a function that moves back and forth.
let sciPlatform = {
    entity: undefined,
    location: 0,
    direction: 1,
    speed: 0.005,
    update: function() {
        this.location += this.speed * this.direction;
        let newPosition = lerp(playAreaWidth / 4, playAreaWidth - playAreaWidth / 4, this.location);
        this.entity.sprite.position.x = newPosition;
        this.entity.collider.get(0).position.x = newPosition;

        if(this.location >= 1)
        {
            this.direction = -1;
        }
        else if(this.location <= 0)
        {
            this.direction = 1;
        }
    }
};

//arrays
let entities = [];
let paddles = [];

//Example of record.
/*
{
"position": [{
    "x": 0,
    "y": 0
}],
"velocity": [{
    "x": 0,
    "y": 0
}],
"type": "BALL"
}
*/
let record = [];

//Additionally loaded entities.
let loadedEntities = [];
let entityTypes = ['BOUNCER', 'COPPER ASTEROID', 'BRONZE ASTEROID', 'SILVER ASTEROID'];

//images
let ballImage;
let bottomImage;
let topImage;
let barVerticalImage;
let barPumpImage;
let bouncerImage;
let playButtomImage;
let backgroundImage;
let exhaustPipeBackgroundImage;
let exhaustPipeForegroundImage;
let pumpBoxImage;
let pumpEndImage;
let paddleImage;
let smallPaddleImage;
let playButtonImage;
let scoreButtonImage;
let quitButtonImage;
let creditButtonImage;
let sciPlatformImages = [];
let copperAsteroidImages = [];
let bronzeAsteroidImages = [];
let silverAsteroidImages = [];

//sound & music
let genericMusic;
let genericMusicIsPlaying = false;
let whoosh1SoundEffect;
let whoosh2SoundEffect;
let boingSoundEffect;
let martianRaySoundEffect;
let beamSoundEffect;

//Videos
let demoVideo;

//Load all images.
function preload()
{
    /*
    27 Planets in HI-RES
    Author: Shaber
    Links:
    - https://opengameart.org/content/27-planets-in-hi-res
    - https://opengameart.org/users/shaber
    - https://creativecommons.org/licenses/by/3.0/
    Licence: CC-BY 3.0

    Changes were made to the artwork.
    */
    ballImage = loadImage("images/plasmaBall.png");

    /*
    Beach Side Pinball Assests:
    Author: ChiliGames
    Links:
    - https://opengameart.org/content/beach-side-pinball-assets
    - https://opengameart.org/users/chiligames
    Licence: Free-To-Use CC0
    */
    bottomImage = loadImage("images/sand bottom.png");
    paddleImage = loadImage("images/pinballPaddle.png");
    smallPaddleImage = loadImage("images/pinballPaddle.png");
    barVerticalImage = loadImage("images/pinballbarvertical.png");
    barPumpImage = loadImage("images/pinballbarvertical.png")
    bouncerImage = loadImage("images/bouncer.png");

    /*
    Shield Effect
    Author: Bonsaiheldin
    Links:
    - https://opengameart.org/content/shield-effect
    - https://opengameart.org/users/bonsaiheldin
    - https://creativecommons.org/licenses/by/3.0/
    Licence CC-BY 3.0

    Changes were made to the Shield Effect artwork.
    */

    topImage = loadImage("images/spr_shield_half.png");

    /*
    Space Backgrounds:
    Author: Rawdanitsu
    Links:
    - https://opengameart.org/content/space-backgrounds-3
    - https://opengameart.org/users/rawdanitsu
    Licence: Free-To-Use CC0
    */
    backgroundImage = loadImage("images/Background-1.png");

    /*
    Asteroids
    Author: phaelax
    Links:
    - https://opengameart.org/content/asteroids
    - https://opengameart.org/users/phaelax
    - https://creativecommons.org/licenses/by-sa/4.0/
    Licence: CC-BY-SA 3.0
    */

    //Each version of the asteroid has 16 variations.
    for(let i = 0; i < 16; i++)
    {
        let url = i;

        //file urls are formatted like cX000X.
        //0 needs to be added to the start if i is not double digits.
        if(i < 10)
        url = "0" + i;

        //Add each variation to its corresponding array.
        copperAsteroidImages.push(loadImage("images/large/c300" + url + ".png"));

        bronzeAsteroidImages.push(loadImage("images/large/c400" + url + ".png"));

        silverAsteroidImages.push(loadImage("images/large/c100" + url + ".png"));
    }

    /*
    Menu Buttons
    Author: Dansevenstar
    Links:
    - https://opengameart.org/content/menu-buttons
    - https://opengameart.org/users/dansevenstar
    - https://creativecommons.org/licenses/by/4.0/
    Licence CC-BY 4.0

    Changes were made to the work. The credit button was create using the author's work.
    */

    playButtomImage = loadImage("images/ui buttons/play button.png");
    scoreButtonImage = loadImage("images/ui buttons/Score button.png");
    quitButtonImage = loadImage("images/ui buttons/quit button.png");
    creditButtonImage = loadImage('images/ui buttons/credits button.png')

    /*
    Sci-Fi Platform (Aniimated)
    Author: jcrown41
    Links:
    - https://opengameart.org/content/sci-fi-platform-animated
    - https://opengameart.org/users/jcrown41
    - http://www.crownjoseph.com/
    Licence: CC0 Free-To-Use
    */

    sciPlatformImages[0] = loadImage("images/Blue/Blue platform 1.png");
    sciPlatformImages[1] = loadImage("images/Blue/Blue platform 2.png");
    sciPlatformImages[2] = loadImage("images/Blue/Blue platform 3.png");
    
    /*
    18 random video game sound effects
    Author: bar
    Links:
    - https://opengameart.org/content/18-random-video-game-sound-effects
    - https://opengameart.org/users/bart
    Licence: CC0 Free-To-Use
    */
    whoosh1SoundEffect = loadSound("sounds/whoosh.wav");
    whoosh2SoundEffect = loadSound("sounds/whoosh2.wav");
    boingSoundEffect = loadSound("sounds/boing.wav");
    martianRaySoundEffect = loadSound("sounds/martianray.wav");
    beamSoundEffect = loadSound("sounds/beam.wav");

    //Create and load audio media elements.

    /*
    Darksydephil - "We're Goin' Back In Time!"
    Author: GhostDrone110
    Linkes:
    - https://www.youtube.com/watch?v=2mi7oOFS05Q
    - https://www.youtube.com/channel/UCU59Ogr3bx0joh3M7Se-zmg
    Distributed for free.
    */
    rewindAudio = createAudio("sounds/going back in time.wav");

    /*
    Space Jazz by Kevin MacLeod
    Link: https://incompetech.filmmusic.io/song/8328-space-jazz
    License: https://filmmusic.io/standard-license
    */
    genericMusic = createAudio("sounds/space-jazz-by-kevin-macleod-from-filmmusic-io.mp3");

    //Original creation.
    exhaustPipeBackgroundImage = loadImage("images/thermal exhaust port/thermal exhaust port - background.png");
    exhaustPipeForegroundImage = loadImage("images/thermal exhaust port/thermal exhaust port - foreground.png");
    pumpBoxImage = loadImage("images/pump/pumpBox.png");
    pumpEndImage = loadImage("images/pump/pumpEnd.png");
    demoVideo = createVideo("videos/demo.m4v");

    //Load entity data.
    loadedEntities = loadJSON("data/pinball_entities.json");

    //Load leaderboard scores.
    leaderboardScores = loadJSON("data/leaderboard_scores.json");

    //Load credits for art and sound.
    creditTextFile = loadStrings("data/credit.txt");
}

function setup()
{
    //Change sound effect volume.
    whoosh1SoundEffect.setVolume(0.25);
    whoosh2SoundEffect.setVolume(0.25);
    boingSoundEffect.setVolume(0.25);
    martianRaySoundEffect.setVolume(0.25);
    beamSoundEffect.setVolume(0.25);

    //Video settings.
    demoVideo.hide();
    demoVideo.volume(0);

    //Convert object to array.
    loadedEntities = loadedEntities.array;

    //The width of the canvas is the area is the play area plus the area taken up by the UI elements.
    createCanvas(playAreaWidth + uiAreaWidth, canvasHeight);

    //For consistency across p5 and p5.play all angle functions will use degrees.
    angleMode(DEGREES);

    //Resize background images and main menu buttons.
    backgroundImage.resize(playAreaWidth + 400.0, canvasHeight);
    playButtomImage.resize(playAreaWidth / 3, canvasHeight / 5);
    scoreButtonImage.resize(playAreaWidth / 3, canvasHeight / 5);
    quitButtonImage.resize(playAreaWidth / 3, canvasHeight / 5);
    creditButtonImage.resize(playAreaWidth / 6, canvasHeight / 9);

    //Create html input button.
    rewindButton = createButton('Go Back In Time');
    rewindButton.position(0, 0, "relative");
    rewindButton.mousePressed(startRewind);
    rewindButton.mouseReleased(stopRewind);
    rewindButton.hide();
}

function draw()
{   
    //Get current time.
    let currentDate = new Date();

    //Update and draw everything!!!
    //(Based on the state of the game.)
    //(and if it isn't paused.)
    switch(currentGameState)
    {
        case 'GAME':
            //Perform game logic.
            if(!isPaused)
            {
                if(wasPaused)
                {
                    resumeGame();

                    wasPaused = false;
                }

                updatePaddles();
    
                updatePump();
    
                //Record positions and angles of moving entities.
                updateRecord();

                checkFail();

                updateBall();

                //After the game is over, replay the last game.
                playReplay();
            }
            else
            {
                if(isRewinding)
                {
                    rewind();
                }

                pauseGame();
            }
            
            //Draw sprites.
            sciPlatform.update();

            image(backgroundImage, -200.0, 0);
    
            drawSprites();
        
            drawUI();
        break;
        case 'MENU':
            //Start playing game music on loop.
            if(!genericMusicIsPlaying)
            {
                genericMusic.loop();
                demoVideo.loop();    
            }

            //Draw demo video in the background of the menu.
            background('black');
            image(demoVideo, 0, 0, playAreaWidth + uiAreaWidth, canvasHeight);
            demoVideo.volume(1);            

            updateAndDrawMenu();
        break;
        case 'LOADING':
            loadGame(currentDate);          
        break;
        case 'LEADERBOARD':
            updateAndDrawLeaderboard();
        break;
        case 'CREDIT':
            updateAndDrawCredit();
        break;
    }
}

//!!!!!!!!!!!!!!!
//DRAW FUNCTIONS
//!!!!!!!!!!!!!!!

//Function dedicated for drawing text to the screen.
function drawUI()
{
    textAlign(LEFT, TOP);
    //Generate black rect for text to be drawn on.
    fill('black');
    rect(playAreaWidth, 0, uiAreaWidth, canvasHeight);
    //Draw text.
    fill('white');
    textSize(20.0);
    text('Controls\nLeft Paddle - z\nRight Paddle - .\nPump - Space\nPause - p\nQuit - Esc\n\nScore: ' + score + 
        "\n\nLives: " + lives, playAreaWidth, 0);


    if(DEVELOPER_MODE)
    {
        text('Currently Selected\nEntity Type:\n' + entityTypes[selectedEntityType] + "\nFlip Mode:\n" + flipMode, playAreaWidth, canvasHeight - 300);
    }

    //Game over text.
    if(isGameOver)
    {
        fill('red');
        text("Game Over! Press 'R' to reset.", playAreaWidth, 400);
    }


}

//!!!!!!!!!!!!!!!!!
//UPDATE FUNCTIONS
//!!!!!!!!!!!!!!!!!

function updateAndDrawMenu()
{
    //Define button locations.
    const playButtonPosition = {
        x: playAreaWidth / 2 - playButtomImage.width / 2, 
        y: canvasHeight / 6 - playButtomImage.height / 2};
    const scoreButtonPosition = {
        x: playAreaWidth / 2 - playButtomImage.width / 2, 
        y: canvasHeight / 6 * 3  - playButtomImage.height / 2};
    const creditButtonPosition = {
        x: playAreaWidth + uiAreaWidth - creditButtonImage.width,
        y: 0};

    //Check for mouse input on the menu buttons to change game states.
    if(mouseIsPressed)
    {
        //Check if the mouse is on the play button.
        if(mouseX > playButtonPosition.x && mouseX < playButtonPosition.x + playButtomImage.width && mouseY > playButtonPosition.y && mouseY < playButtonPosition.y + playButtomImage.height)
        {
            currentGameState = 'LOADING';
        }
        //Check if the mouse is on the score button.
        else if(mouseX > scoreButtonPosition.x && mouseX < scoreButtonPosition.x + scoreButtonImage.width && mouseY > scoreButtonPosition.y && mouseY < scoreButtonPosition.y + scoreButtonImage.height)
        {
            currentGameState = 'LEADERBOARD';
        }
        //Check if the mouse is on the credit button.
        else if(mouseX > creditButtonPosition.x && mouseX < creditButtonPosition.x + scoreButtonImage.width && mouseY > creditButtonPosition.y && mouseY < creditButtonPosition.y + scoreButtonImage.height)
        {
            currentGameState = 'CREDIT';
        }
    }

    //Draw buttons.
    image(playButtomImage, playButtonPosition.x,  playButtonPosition.y);
    image(scoreButtonImage, scoreButtonPosition.x, scoreButtonPosition.y);
    image(creditButtonImage, creditButtonPosition.x, creditButtonPosition.y);
}

function updateAndDrawLeaderboard()
{
    //Clear canvas.
    background('black');

    //Mute menu music.
    demoVideo.volume(0);

    updateAndDrawReturnToMenuButton();

    textAlign(LEFT, CENTER);
    textSize(20);

    fill('white');
    //Draw scores to the middle of the screen.
    for (let index = 0; index < leaderboardScores.highscores.length; index++) {
        const player = leaderboardScores.highscores[index];
        text((index + 1) + ". " + player.name + " - " + player.score, playAreaWidth / 2 - 100, canvasHeight / 3 + index * textSize());                
    }
}

function updateAndDrawReturnToMenuButton()
{
    const quitButtonPosition = {
        x: playAreaWidth / 2 - quitButtonImage.width / 2,
        y: canvasHeight - canvasHeight / 3
    }

    //Check if the mouse is clicking on the quit button.
    if(mouseIsPressed &&  mouseX > quitButtonPosition.x && mouseX < quitButtonPosition.x + quitButtonImage.width &&
            mouseY > quitButtonPosition.y && mouseY < quitButtonPosition.y + quitButtonImage.height)
    {
        currentGameState = 'MENU';
    }

    //Draw button 
    image(quitButtonImage, quitButtonPosition.x, quitButtonPosition.y);
}

//Draw the credit screen and handle input to go back to the menu.
function updateAndDrawCredit()
{
    //Clear canvas.
    background('black');

    //Mute menu music.
    demoVideo.volume(0);

    updateAndDrawReturnToMenuButton();

    textAlign(LEFT, TOP);
    const size = 12;
    const maxLines = 40;
    let textOffsetX = 0;
    textSize(size);
    fill('white');

    //Write each line from the credit text file to the screen.
    for (let line = 0; line < creditTextFile.length; line++) {
        const element = creditTextFile[line];

        //After a certain number of lines draw the text going down starting at the top of the screen again.
        //Offset text to the right.
        if(line % maxLines == 0 && line != 0)
        {
            textOffsetX += 400;
        }

        //Draw line.
        text(element, textOffsetX, (line % maxLines) * size);
    }
}

function loadGame(currentDate)
{
    //Clear canvas.
    background('black');
            
    //Set time spent loading.
    if(loadingTime == undefined)
    loadingTime = currentDate.getTime() + 2000;

    if(loadingText == undefined)
    loadingText = "Loading";

    //Mute menu demo video;
    demoVideo.volume(0);

    //Check if enough time has passed to initialise the game.
    if(currentDate.getTime() < loadingTime)
    {
        textAlign(LEFT, CENTER);
        textSize(50);
        fill('white');
        
        //Draw text to show the game loading.
        text(loadingText, playAreaWidth / 2, canvasHeight / 2);

        loadingText = loadingText + '.'

        if(loadingText == "Loading.........")
        loadingText = "Loading";
    }
    else
    {
        //Reset loading state variables.
        loadingTime = undefined;
        loadingText = undefined;

        //Initialise game and set game state to game.
        initialiseSketch();
        console.log(entities);
        currentGameState = 'GAME';
        //Show Input GUI element.
        rewindButton.show();
    }  
}


//If pump key is pressed compress pump and build up force. When pump key is released decompress and put force into pinball Y velocity.
function updatePump()
{
    const PUMP_SPEED = 0.025;
    const addedForce = 0.15;

    //When the pump key is pressed and end of pump isn't fully compressed, compress and add force to the pump.
    //The percent that the pump is compressed is a value between 0 and 1.
    //When the pump key is let go, begin to extend pump end (until fully extended.) If the ball is currently being held by the pump add Y velocity force to the ball to send it up into the air.
    if(pump.keyPressed)
    {
        if(pump.endOffsetY < 1)
        {
            pump.endOffsetY += PUMP_SPEED;
            pump.force += addedForce;
        }
    }
    else
    {
        if(pump.endOffsetY > 0)
        pump.endOffsetY -= PUMP_SPEED;
        
        //Launch ball in the air and play a sound effect.
        if(pump.isBallHeld && pump.force > 0)
        {
            ball.position.y -= 20.0;
            ball.setVelocity(0, -pump.force);
            pump.force = 0;
            pump.isBallHeld = false;
            martianRaySoundEffect.play();
        }
    }

    //Set the position of the pump end by interperlating between the pumps's bpx Y position and 25 points down the canvas.
    let newPosition = lerp(pump.box.sprite.position.y, pump.box.sprite.position.y + 5.0, pump.endOffsetY);
    pump.end.sprite.position.y = newPosition;
    pump.end.collider.get(0).position.y = newPosition - 5.0;
}

function updateRecord()
{
    //Go through each entry
    record.forEach(item =>
    {
        //Every frame create a time line of properties for each entry.
        switch(item.type)
        {
            case 'PADDLE':
                item.angle.push(paddles[item.number].angle);
            break;
            case 'SCI PLATFORM':
                item.location.push(sciPlatform.location);
            break;
            case 'BALL':
                item.position.push({x:ball.position.x, y:ball.position.y});
                item.velocity.push({x:ball.velocity.x, y:ball.velocity.y});
            break;
            case 'GAME VARIABLES':
                item.score.push(score);
                item.lives.push(lives);
                item.isGameOver.push(isGameOver);
                item.pointInTime.push(pointInTime);
            break;
        }
    });

    console.log(record);
}

function resumeGame()
{
    //Set velocity and keep positions still while paused.
    record.forEach(item => {
        switch(item.type)
        {
            case 'PADDLE':
                paddles[item.number].angle = item.angle[item.angle.length - 1];
            break;
            case 'SCI PLATFORM':
                sciPlatform.location = item.location[item.location.length - 1];
            break;
            case 'BALL':
                ball.velocity.x = item.velocity[item.velocity.length - 1].x;
                ball.velocity.y = item.velocity[item.velocity.length - 1].y;
                ball.position.x = item.position[item.position.length - 1].x;
                ball.position.y = item.position[item.position.length - 1].y;
            break;
        }
    });
}

function pauseGame()
{
    wasPaused = true;;

    //Turn off velocity and keep positions still while paused.
    record.forEach(item => {
        switch(item.type)
        {
            case 'PADDLE':
                paddles[item.number].angle = item.angle[item.angle.length - 1];
                //Graphically update date, other the paddles don't visually update when rewinding.
                paddles.forEach(paddle => {
                    paddle.update();
                });
            break;
            case 'SCI PLATFORM':
                sciPlatform.location = item.location[item.location.length - 1];
            break;
            case 'BALL':
                ball.velocity.x = 0;
                ball.velocity.y = 0;
                ball.position.x = item.position[item.position.length - 1].x;
                ball.position.y = item.position[item.position.length - 1].y;
            break;
            case 'GAME VARIABLES':
                score = item.score[item.score.length - 1];
                lives = item.lives[item.lives.length - 1];
                isGameOver = item.isGameOver[item.isGameOver.length - 1];
                pointInTime = item.pointInTime[item.pointInTime.length - 1];
            break;
        }
    });
}

function setToPointInTime(frame)
{
    //Go through each item and set their properties to a point in time.
    record.forEach(item => {
        switch(item.type)
        {
            case 'PADDLE':
                paddles[item.number].angle = item.angle[frame];
                //Graphically update date, other the paddles don't visually update when rewinding.
                paddles.forEach(paddle => {
                    paddle.update();
                });
            break;
            case 'SCI PLATFORM':
                sciPlatform.location = item.location[frame];
            break;
            case 'BALL':
                ball.velocity.x = 0;
                ball.velocity.y = 0;
                ball.position.x = item.position[frame].x;
                ball.position.y = item.position[frame].y;
            break;
        }
    });
}

function updateBall()
{
    //Apply gravity to the ball.
    if(gravity)
    ball.addSpeed(0.0666, 90);

    //Update sprite and check collision multiple times in a single frame to speed up the ball.
    const totalLoops = 3;
    for(let loop = 0; loop < totalLoops; loop++)
    {
        if(loop != 0 )
        ball.update();

        checkCollision();
        ball.limitSpeed(6.0);
    }
}

//Run update and input handling for each paddle.
function updatePaddles()
{
    paddles.forEach(paddle => {
        paddle.update();
        paddle.handleInput();
    });
}

function checkFail()
{
    if(ball.position.y > canvasHeight)
    {
        //If there are still extra lives remove one life and place ball at starting area.
        if(lives > 0)
        {
            //Remove a life.
            lives--;

            //Move ball back to starting area with no velocity.
            resetBall();
        }
        else
        {
            //If game just ended set pointInTime to 0 to start replay at the start.
            if(isGameOver = false)
            {
                pointInTime = 0;
            }

            isGameOver = true;
        }
    }
}

function playReplay()
{
    if(isGameOver)
    {
        //Move point in time forward.
        pointInTime++;

        //Set properties of game entites to point in time.
        setToPointInTime(pointInTime);
    }
}

function startRewind()
{
    //Pause the game.
    //When the game is paused the game sets moving elements to their last recorded point in the record.
    //When rewind is true, pop elements off the record.
    isPaused = true;
    isRewinding = true;

    //Make song play on loop while rewinding.
    genericMusic.stop();
    rewindAudio.loop();
}

function stopRewind()
{
    isPaused = false;
    isRewinding = false;

    //Stop audio when finished rewinding.
    rewindAudio.stop();
    genericMusic.loop();
}

function rewind()
{
    //Pop information from record unless it is the first input.
    record.forEach(item => {
        switch(item.type)
        {
            case 'PADDLE':
                if(item.angle.length != 1)
                item.angle.pop();
            break;
            case 'SCI PLATFORM':
                if(item.location.length != 1)
                item.location.pop();
            break;
            case 'BALL':
                if(item.velocity.length != 1)
                item.velocity.pop();
                if(item.position.length != 1)
                item.position.pop();    
            break;
            case 'GAME VARIABLES':
                if(item.score.length != 1)
                item.score.pop();
                if(item.lives.length != 1)
                item.lives.pop();
                if(item.isGameOver.length != 1)
                item.isGameOver.pop();
                if(item.pointInTime.length != 1);
                item.pointInTime.pop();
            break;
        }
    });
}

//!!!!!!!!!!!!!!!!!
//COLLISION CHECKS
//!!!!!!!!!!!!!!!!!

function undoMovement()
{
    ball.position.x = ball.previousPosition.x;
    ball.position.y = ball.previousPosition.y;
}

//Function bounces pinball off point.
function bouncePoint(x, y, addedForce = 0)
{ 
    //Displace ball.    
    //Calculate the angle the ball is from the entity.
    const a = atan2(ball.position.y - y, ball.position.x - x);

    //Move out of collision.
    ball.position.x += cos(a) * ball.width;
    ball.position.y += sin(a) * ball.width;
    
    //Add new force to the speed used.
    const totalVelocity = ball.getSpeed() + addedForce;

    //Set velocity away from where the pinball hit the entity.
    ball.setSpeed(totalVelocity, a);
}

//function bounces pinball off a rectangle.
//Takes in as a parameter the collider the ball is overlapping.
function bounceRectangle(collider)
{    
    undoMovement();
    //If the ball is left or right of the rectangle flip x velocity.
    if(ball.position.x < collider.position.x - collider.width / 2)
    {
        ball.velocity.x = -absoluteValue(ball.velocity.x);
    }
    else if (ball.position.x > collider.position.x + collider.width / 2)
    {
        ball.velocity.x = absoluteValue(ball.velocity.x);
    }
    
    //If the ball is above or below of the rectangle flip y velocity.
    if(ball.position.y < collider.position.y - collider.height / 2)
    {
        ball.velocity.y = -absoluteValue(ball.velocity.y);
    } 
    else if(ball.position.y > collider.position.y + collider.height / 2)
    {
        ball.velocity.y = absoluteValue(ball.velocity.y);
    }
}

function bounce(collider)
{
    /*
    Check if the collider that the ball is overlapping is a Axis Alighned Bounding Box.
    There are only two types of colliders in p5.play so else it must be a CircleCollider.
    If it is a rectangle use rectangle bounce logic.
    */
    if(collider.collider instanceof AABB) 
    {
        bounceRectangle(collider)
    }
    else
    {
        bouncePoint(collider.position.x, collider.position.y)
    } 
}

/*
Create collision between two points.
//This function series sprites with circle colliders along the line between
//the two points.
*/
function createLineCollider(x1, y1, x2, y2)
{
    //Get the angle that pooint two is at from point one.
    const angle = atan2(y2 - y1, x2 - x1);
    //Get length of line between two points.
    const totalDistance = dist(x1, y1, x2, y2);
    //How thick is the line collider.
    const diameter = 25.0;

    //Loop until the total radius of all sprites is not less than the distance between
    //between the two points.
    //Starting at point one after every loop create another sprite in the direction of point two by the length of a diameter.
    let colliders = [];
    for(let currentDistance = 0; currentDistance < totalDistance; currentDistance += diameter / 2)
    {
        colliders.push(createCollider(x1 + cos(angle) * currentDistance, y1 + sin(angle) * currentDistance, diameter, diameter, "circle"));
    }
    return colliders;
}

/*
Dedicated function for creating a collider object with preset immovable and visiability properties.
A collider should both be not visiable and immovable.
*/
function createCollider(positionX, positionY, width, height, type)
{
    let newCollider = createSprite(positionX, positionY, width, height);
    newCollider.immovable = true;
    newCollider.visible = false;

    if(type == "circle")
    {
        newCollider.setCollider("circle");
    }
    else
    {
        newCollider.setCollider("rectangle");
    }

    return newCollider;
}

//This function handles all the collision checks for the pinball.
function checkCollision()
{
    
    entities.forEach(entity => 
        {
            //Check if the ball is overlapping the entity's collider(s)
            ball.overlap(entity.collider, (ball, collider) => 
            {
                switch(entity.type)
                {
                    case 'PADDLE':
                        /*
                        Bounce off point collided with on the paddle, add more force to the pinball towards the end of the paddle and play soundeffect. 
                        Only bounce if the paddle swinging.
                        Compare the angle of the paddle to the angle between the paddle and the ball to see if the ball is underneath the paddle, bounce off if underneath.
                        */
                        const ballPaddleAngle = atan2(entity.sprite.position.y - ball.position.y, entity.sprite.position.x - ball.position.x)
                        if((entity.keyPressed && entity.angle > PADDLE_MINIMUM_ANGLE) || 
                        (!entity.flipped && ballPaddleAngle > entity.angle) || (entity.flipped && ballPaddleAngle < entity.angle && ballPaddleAngle > 0))
                        {
                            bouncePoint(collider.position.x, collider.position.y, dist(entity.sprite.position.x, entity.sprite.position.y, collider.position.x, collider.position.y) / PADDLE_FORCE);
                            whoosh1SoundEffect.play();
                        }
                        else
                        {
                            /*
                            If the paddle isn't swinging the ball should just slide across the paddle.
                            The ball should slide away from the paddle if the paddle is angled down and
                            towards the paddle if it is angledc up.
                            */
                            ball.limitSpeed(2.0);
                            bouncePoint(collider.position.x, collider.position.y);
                            if(entity.angle > 0)
                            {
                                /*Compare difference in X position between the ball and the paddle to determine if the paddle
                                is to the left of the ball or to the right of the ball.*/
                                ball.setSpeed(limitToOne(ball.position.x - entity.sprite.position.x) * 2.0, 0);
                            }
                            else
                            {
                                ball.setSpeed(limitToOne(ball.position.x - entity.sprite.position.x) * 2.0, 180);
                            }
                        }
                    break;
                    //This is the sandpits. THe ball doesn't bounce and will only role down to the exhaust pipe.
                    case 'DEATH PIT':
                        ball.collide(entity.collider);
                        if(ball.position.x < playAreaWidth /2)
                        {
                            ball.setSpeed(2.0, 0);
                        }
                        else
                        {
                            ball.setSpeed(2.0, 180);
                        }
                        //beachSoundEffect.play();
                    break;
                    //If the ball touches the exhaust pipe, move to middle of exhaust pipe so the ball falls in.
                    case 'EXHAUST PIPE':
                        ball.position.x = playAreaWidth / 2;
                    break;
                    /*
                    The asteroids all generate score.
                    Silver = 300 points.
                    Bronze = 200 points.
                    Copper = 100 points.
                    */
                    case 'SILVER ASTEROID':
                        score += 100;
                    case 'BRONZE ASTEROID':
                        score += 100;
                    case 'COPPER ASTEROID':
                        score += 100;
                        bounce(collider);
                        whoosh2SoundEffect.play();
                    break;
                    //PUMP COLLISION
                    case 'PUMP':
                        undoMovement();
                        ball.setVelocity(0,0);
                        pump.isBallHeld = true;
                    break;
                    case 'BOUNCER':
                        //Bounce ball off bouncer and play sound effect.
                        bouncePoint(collider.position.x, collider.position.y, 1.5);
                        boingSoundEffect.play();
                    break;
                    case 'SHIELD':
                        bounce(collider);
                        boingSoundEffect.play();
                    break;
                    //If the entity has no type collision is handled here.
                    default:
                        //If no type is provided, check whether the collider is a rectangle or a circle and bounce accordingly. Play generic sound effect.
                        bounce(collider);
                        whoosh2SoundEffect.play();
                    break;
                }             
            });
    });
}

//!!!!!!!!!!!!!!!!
//INPUT FUNCTIONS
//!!!!!!!!!!!!!!!!

//Constants for keyCode values.
const SPACE_BAR = 32;
const Z_KEY = 90;
const S_KEY = 83;
const R_KEY = 82;
const V_KEY = 86;
const F_KEY = 70;
const P_KEY = 80;
const PERIOD_KEY = 190;
const ESC_KEY = 27;

//Called everytime a key is pressed.
function keyPressed()
{
    //Only handle keyboard input if in game.
    if(currentGameState == 'GAME')
    {
        //keyCode is set to the number code of the key pressed when this function was called.
        switch(keyCode)
        {
            //Pause and unpause game.
            case P_KEY:
                //The rewinding feature uses the pause functionality. 
                //Using the pause button must not interreupt this.
                if(isRewinding == false)
                {
                    isPaused = !isPaused;
                }
            break;
            //Toggle flip mode which is used for which direction entities created with the mouse are facing.
            case F_KEY:
                if(DEVELOPER_MODE)
                flipMode = !flipMode;
            break;
            //These case statements update the selected entity.
            case LEFT_ARROW:
                if(selectedEntityType != 0 && DEVELOPER_MODE)
                selectedEntityType--;
            break;
            case RIGHT_ARROW:
                if(selectedEntityType!=entityTypes.length - 1 && DEVELOPER_MODE)
                selectedEntityType++;
            break;        break;
            case Z_KEY:
                //Activate all paddles facing right.
                paddles.forEach(paddle => {
                    if(paddle.flipped == false)
                    {
                        paddle.keyPressed = true;
                    }
                });
            break;
            case PERIOD_KEY:
                //Activate all paddles facing left.
                paddles.forEach(paddle => {
                    if(paddle.flipped == true)
                    {
                        paddle.keyPressed = true;
                    }
                });
            break;
            case V_KEY:
                toggleColliderVisibility();
            break;
            //Hold down space bar to compress pump to launch pinball.
            case SPACE_BAR:
                pump.keyPressed = true;
            break;
            //Save current entities to JSON file.
            case S_KEY:
                if(DEVELOPER_MODE)
                saveJSON({array: loadedEntities}, 'pinball_entities');
            break;
            case R_KEY:
                //Reset the lives, score and ball and set the game as not being over.
                lives = 3;
                score = 0;
                
                //Reset the record.
                record.forEach(item => {
                    switch(item.type)
                    {
                        case 'PADDLE':
                            item.angle = [item.angle[0]];
                        break;
                        case 'SCI PLATFORM':
                            item.location = [item.location[0]];
                        break;
                        case 'BALL':
                            item.velocity = [item.velocity[0]];
                            item.position = [item.position[0]]; 
                        break;
                        case 'GAME VARIABLES':
                            item.score = [item.score[0]];
                            item.lives = [item.lives[0]];
                            item.isGameOver = [item.isGameOver[0]];
                        break;
                    }
                });

                resetBall();
                isGameOver = false;
            break;
            case ESC_KEY:
                deinitialiseSketch();
            break;
        }
    }
}

//Called everytime a key is pressed.
function keyReleased()
{
    if(currentGameState == 'GAME')
    {
        //keyCode is set to the number code of the key pressed when this function was called.
        switch(keyCode)
        {
            case Z_KEY:
                //Deactivate all paddles facing right.
                paddles.forEach(paddle => {
                    if(paddle.flipped == false)
                    {
                        paddle.keyPressed = false;
                    }
                });
            break;
            case PERIOD_KEY:
                //Deactivate all paddles facing left.
                paddles.forEach(paddle => {
                    if(paddle.flipped == true)
                    {
                        paddle.keyPressed = false;
                    }
                });
            break;
            case SPACE_BAR:
                pump.keyPressed = false;
            break;
        }
    }

}

//Function is called when the mouse is clicked.
function mousePressed()
{
    if(DEVELOPER_MODE && currentGameState == 'GAME')
    {
        //Record to array keeping track of entities that need to be later saved and loaded in.
        //Coordinates are recorded as relative coordinates.
        loadedEntities.push(
        {
            x: mouseX / playAreaWidth, 
            y: mouseY / canvasHeight, 
            type:entityTypes[selectedEntityType], 
            flipped: flipMode
        });

        //Create new entity where the mouse is clicked.
        switch(entityTypes[selectedEntityType])
        {
            case 'BOUNCER':
                createBouncer(mouseX, mouseY, flipMode);
            break;
            case 'COPPER ASTEROID':
            case 'BRONZE ASTEROID':
            case 'SILVER ASTEROID':
                createAsteroid(mouseX, mouseY, entityTypes[selectedEntityType]);    
            break;
        }
    }
}

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//INITALISATION AND DEINITIALISATION FUNCTIONS
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

function initialiseSketch()
{
    initialiseBoundary();
    initialiseTop();
    initialiseBottom();
    initialisePump();

    /*
    To make sure the ball appears over the background element but
    not the forground element it needs to be initalised inbetween the two sprites.
    */
    initialiseExhaustPipeBackground();
    initialiseBall();
    initialiseExhaustPipeForeground();

    initialisePaddles();

    initialiseSciPlatform()

    //Initialise all remaining entities from JSON file.
    initialiseOtherEntities();

    //Initialise score and lives to record.
    record.push({
        score:[score],
        lives:[lives],
        isGameOver:[isGameOver],
        pointInTime:[pointInTime],
        type:"GAME VARIABLES"
    });
}

//Creates ball sprite and sets ball properties and image.
function initialiseBall()
{
    const BALL_DIAMETER = 15.0;
    ballStart.x = playAreaWidth - 20.0;
    ballStart.y = canvasHeight / 2;
    ball = createSprite(ballStart.x, ballStart.y, BALL_DIAMETER, BALL_DIAMETER);
    ball.setCollider("circle");
    ballImage.resize(BALL_DIAMETER + 6.0, BALL_DIAMETER + 6.0);
    ball.addImage('plasma', ballImage);
    ball.friction = 0.0035;

    //Initalise into record.
    record.push(
    {
        position: [{x:ballStart.x, y:ballStart.y}],
        velocity: [{x:0, y:0}],
        type:"BALL"
    });    
}

function initialisePump()
{
    barPumpImage.resize(25.0, canvasHeight / 2);
    //Create pump area.
    let pumpAreaWall = createSprite(playAreaWidth - 40.0, canvasHeight - canvasHeight / 2.5);
    pumpAreaWall.addImage(barPumpImage);

    new Entity
    (
        pumpAreaWall,
        createCollider(pumpAreaWall.position.x, pumpAreaWall.position.y, pumpAreaWall.width, pumpAreaWall.height, 'rectangle'),
        'PUMP WALL'
    );

    //Create pump.

    pumpEndImage.resize(pumpEndImage.width / 10 * 2, 0);
    pumpEndSprite = createSprite(playAreaWidth - 20.0, canvasHeight - canvasHeight / 5);
    pumpEndSprite.addImage(pumpEndImage);
    pump.end = new Entity
    (
        pumpEndSprite,
        createCollider(pumpEndSprite.position.x, pumpEndSprite.position.y - 5.0, 10.0, 10.0, 'rectangle'),
        'PUMP'
    );

    pumpBoxImage.resize(pumpBoxImage.width / 10 * 2, 0);
    pumpBoxSprite = createSprite(pumpEndSprite.position.x, pumpEndSprite.position.y);
    pumpBoxSprite.addImage(pumpBoxImage);
    pump.box = new Entity
    (
        pumpBoxSprite,
        createCollider(pumpBoxSprite.position.x, pumpBoxSprite.position.y + 5.0, 10.0, 10.0, 'rectangle'),
        'PUMP'
    );


}

function initialiseSciPlatform()
{
    //Resize images to appropriate sizes.
    sciPlatformImages.forEach(image =>
        image.resize(100.0, 40.0)
    )

    //Create entity.
    sciPlatform.entity = new Entity
    (
        createSprite(playAreaWidth / 2, canvasHeight / 2.5),
        createCollider(playAreaWidth /2, canvasHeight /2.5, 100.0, 40.0, 'rectangle'),
        'SCI PLATFORM'
    );

    //Add animations to sprite.
    sciPlatform.entity.sprite.addAnimation('hover', sciPlatformImages[0], sciPlatformImages[1], sciPlatformImages[2]);

    //Initalise into record.
    record.push(
        {location:[0],
         type:"SCI PLATFORM"}
    );
}

function initialisePaddles()
{
    //Set length of paddle image.
    paddleImage.resize(250.0, 0)
    smallPaddleImage.resize(175.0, 0);

    //Create object containing left paddle x & y coordinates.
    let leftPaddlePosition = {x: playAreaWidth / 3.75, y: canvasHeight - canvasHeight / 3.5};
    let leftSmallPaddlePosition = {x: playAreaWidth / 10, y: canvasHeight / 2.5 };

    //Add left paddle to paddles array.
    new Paddle(leftPaddlePosition.x, leftPaddlePosition.y, false, 'BIG');
    new Paddle(leftSmallPaddlePosition.x, leftSmallPaddlePosition.y, false, 'SMALL');

    //Create object containing left paddle x & y coordinates.
    let rightPaddlePosition = {x:  playAreaWidth - leftPaddlePosition.x, y: leftPaddlePosition.y};
    let rightSmallPaddlePosition = {x:  playAreaWidth - playAreaWidth / 10, y: leftSmallPaddlePosition.y};
    //Add left paddle to paddles array.
    new Paddle(rightPaddlePosition.x, rightPaddlePosition.y, true, 'BIG');
    new Paddle(rightSmallPaddlePosition.x, rightSmallPaddlePosition.y, true, 'SMALL');

    //Initialise paddles into record array.
    for(let i = 0; i < paddles.length; i++)
    {
        record.push({
            angle:[paddles[i].angle],
            type:"PADDLE",
            number:i
            }
        );
    }
}

//Creates colliders to keep the ball inside the sketch.
function initialiseBoundary()
{
    //Resize vertical bar to match canvas height.
    barVerticalImage.resize(25.0, canvasHeight);
    //Left edge entity.
    //Create sprite for left edge entity.
    let leftBarSprite = createSprite(0, canvasHeight / 2, 120.0, canvasHeight);
    leftBarSprite.addImage(barVerticalImage);
    new Entity
    (
        leftBarSprite,
        createCollider(leftBarSprite.position.x, canvasHeight / 2, barVerticalImage.width, canvasHeight)
    );


    //Right edge entity.
    //Create sprite for right edge entity.
    let rightBarSprite = createSprite(playAreaWidth, canvasHeight / 2, 10.0, canvasHeight);
    rightBarSprite.addImage(barVerticalImage);
    new Entity
    (
        rightBarSprite,
        createCollider(rightBarSprite.position.x, canvasHeight / 2, barVerticalImage.width, canvasHeight)
    );
}

//Create sprite and colliders for top barrier of sketch.
function initialiseTop()
{
    //Resize so this image matches the width of the canvas.
    topImage.resize(playAreaWidth + 40.0, 166.0);

    let topSprite;
    //Create visual sprite at top of canvas.
    topSprite = createSprite(playAreaWidth / 2, topImage.height / 2, 0, 0);
    topSprite.addImage(topImage);

    //Create a new entity using the the visual sprite and colliders generated.
    new Entity
    (
        topSprite,
        [].concat(createLineCollider(0, topImage.height, topImage.width / 8, topImage.height / 2),
        createLineCollider(topImage.width / 8, topImage.height / 2, playAreaWidth / 2 - playAreaWidth / 8, 40.0),
        createCollider(playAreaWidth / 2, 40.0, playAreaWidth / 4, 20.0),
        createLineCollider(playAreaWidth -  playAreaWidth / 2 + playAreaWidth / 8, 40.0, playAreaWidth - topImage.width / 8, topImage.height / 2),
        createLineCollider(playAreaWidth - topImage.width / 8, topImage.height / 2, playAreaWidth, topImage.height)),
        'SHIELD'
    );
}

//Create sprite and colliders for bottom barrier of sketch.
function initialiseBottom()
{
    //Resize so this image matches the width of the canvas.
    bottomImage.resize(playAreaWidth, 144.8);

    let bottomSprite;
    //Create visual sprite at bottom of canvas.
    bottomSprite = createSprite(playAreaWidth / 2, canvasHeight - bottomImage.height / 2, 0, 0);
    bottomSprite.addImage(bottomImage);

    //Create a new entity using the the visual sprite and colliders generated.
    new Entity
    (
        bottomSprite,
        [].concat(
        //Left slope colliders
        createLineCollider(0, canvasHeight - bottomImage.height, playAreaWidth / 2.416, canvasHeight - canvasHeight / 30),
        //Right slope collder
        createLineCollider(playAreaWidth - playAreaWidth / 2.416, canvasHeight - canvasHeight / 30, playAreaWidth, canvasHeight - bottomImage.height * 0.85)
        ),
        'DEATH PIT'
    );
}

//The exhaust pipe is separated into a background sprite and a foreground sprite.
//This creates the perspective of the ball falling into the exhaust pipe.
function initialiseExhaustPipeBackground()
{
    exhaustPipeBackgroundImage.resize(playAreaWidth / 5, 38.0);
    let exhaustPipeBackgroundSprite;
    //Create visual sprite at bottom of canvas.
    exhaustPipeBackgroundSprite = createSprite(playAreaWidth / 2, canvasHeight - exhaustPipeBackgroundImage.height / 2);
    exhaustPipeBackgroundSprite.addImage(exhaustPipeBackgroundImage);

    new Entity
    (
        exhaustPipeBackgroundSprite,
        //Left side of pipe.
        [createCollider(exhaustPipeBackgroundSprite.position.x - exhaustPipeBackgroundImage.width / 3,
                        exhaustPipeBackgroundSprite.position.y, exhaustPipeBackgroundImage.width / 4, 
                        exhaustPipeBackgroundImage.height),
        //Right side of pipe.
         createCollider(exhaustPipeBackgroundSprite.position.x + exhaustPipeBackgroundImage.width / 3,
            exhaustPipeBackgroundSprite.position.y, exhaustPipeBackgroundImage.width / 4, 
            exhaustPipeBackgroundImage.height)],
        'EXHAUST PIPE'
    );
}

function initialiseExhaustPipeForeground()
{
    exhaustPipeForegroundImage.resize(playAreaWidth / 5, 40.0);
    let exhaustPipeForegroundSprite;
    //Create visual sprite at bottom of canvas.
    exhaustPipeForegroundSprite = createSprite(playAreaWidth / 2, canvasHeight - exhaustPipeForegroundImage.height / 2);
    exhaustPipeForegroundSprite.addImage(exhaustPipeForegroundImage);

    new Entity
    (
        exhaustPipeForegroundSprite
    );
}

//Initialise entities from JSON file.
function initialiseOtherEntities()
{
    //Resize all remaining images.
    bouncerImage.resize(80.0, 0);

    //Each version of the asteroid has 16 variations.
    for(let i = 0; i < 16; i++)
    {
        //Resize each variation.
        copperAsteroidImages[i].resize(copperAsteroidImages[i].width / 10 * 2, 0);

        bronzeAsteroidImages[i].resize(bronzeAsteroidImages[i].width / 10 * 2, 0);

        silverAsteroidImages[i].resize(silverAsteroidImages[i].width / 10 * 2, 0);
    }

    loadedEntities.forEach(entity => 
    {
        //Convert relative coordinates into absolute coordinates.
        let absoluteX = entity.x * playAreaWidth;
        let absoluteY = entity.y * canvasHeight;
        switch(entity.type)
        {
            case 'BOUNCER':
                createBouncer(absoluteX, absoluteY, entity.flipped);
            break;
            case 'COPPER ASTEROID':
            case 'BRONZE ASTEROID':
            case 'SILVER ASTEROID':
                createAsteroid(absoluteX, absoluteY, entity.type);
            break;
        } 
    });
}

function deinitialiseSketch()
{
    //Hide gui elements.
    rewindButton.hide();
    
    //Delete ball.
    ball.remove();
    ball = null;
    
    //Loop through each entity in the game and delete its sprite and collider and then itself.
    entities.forEach(entity => 
    {
        
        if(entity.sprite != null)
        {
            entity.sprite.remove();
            entity.sprite = null;
        }

        entity.collider.forEach(colliderPart =>
        {
            colliderPart.remove();
            colliderPart = null;
        });
    });

    //Reset arrays.
    entities = [];
    paddles = [];
    record = [];

    console.log(entities);

    //Set game state to menu.
    currentGameState = 'MENU';
}

//!!!!!!!!!!!!!!!
//MISC FUNCTIONS
//!!!!!!!!!!!!!!!

function toggleColliderVisibility()
{
    if(DEVELOPER_MODE)
    {
        //Loop through each entity and each of its colliders to change
        //their visibility.
        collisionVisibility = !collisionVisibility;
        entities.forEach(entity =>
        { 
            for (let index = 0; index < entity.collider.length; index++) {
                const element = entity.collider.get(index);
                element.visible = collisionVisibility;                        
            }
        });
        
        ball.debug = collisionVisibility;
    }
}

//Resets ball to beginning conditions.
function resetBall()
{
    ball.position.x = ballStart.x;
    ball.position.y = ballStart.y;

    ball.setVelocity(0, 0);
}

//Set all negative values to -1 and all positive values to 1.
function limitToOne(value)
{
    if(value > 0)
    {
        return 1;
    }
    else if(value < 0)
    {
        return -1;
    }
    else
    {
        return 0;
    }
}

//Return only positive values. Negative values are converted to positive values.
//Positive values are returns with no changes.k
function absoluteValue(value)
{
    if(value < 0)
    {
        return -value;
    }
    else
    {
        return  value;
    }
}

//!!!!!!!!!!!!!!!!!!!!!!!!!!
//ENTITY CREATION FUNCTIONS
//!!!!!!!!!!!!!!!!!!!!!!!!!!

function createBouncer(x, y, isFlipped)
{
    let newBouncer = createSprite(x, y);
    let flipped = 1;
    if(isFlipped)
    {
        flipped = -1;
    }

    newBouncer.mirrorX(flipped);

    const DIAMETER = bouncerImage.width / 1.5;

    newBouncer.addImage(bouncerImage);
    new Entity
    (
        newBouncer,
        [createCollider(x, y, DIAMETER, DIAMETER, 'circle'),
        createCollider(x - (bouncerImage.width / 5) * flipped, y - (bouncerImage.height / 5), DIAMETER, DIAMETER, 'circle'),
        createCollider(x + (bouncerImage.width / 5) * flipped, y + (bouncerImage.height / 5), DIAMETER, DIAMETER, 'circle')],
        'BOUNCER'
    );
}

function createAsteroid(x, y, type)
{
    let newAsteroid = createSprite(x, y);

    switch(type)
    {
        case 'COPPER ASTEROID':
            newAsteroid.addImage(random(copperAsteroidImages))
        break;
        case 'BRONZE ASTEROID':
            newAsteroid.addImage(random(bronzeAsteroidImages))
        break;
        case 'SILVER ASTEROID':
            newAsteroid.addImage(random(silverAsteroidImages))
        break;
    }

    new Entity
    (
        newAsteroid,
        createCollider(x, y, 25.0, 25.0, 'circle'),
        type
    );
}

