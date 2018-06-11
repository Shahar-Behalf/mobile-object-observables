"use strict";
// these are tests at the boundaries of the Server
// it assumes a Server is running
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
const operators_5 = require("rxjs/operators");
const operators_6 = require("rxjs/operators");
const socket_io_observable_1 = require("./socket-io-observable");
const server_multi_object_1 = require("./server-multi-object");
const server_multi_object_2 = require("./server-multi-object");
const socketServerUrl = 'http://localhost:8081';
// =====================================================================================================================
// ===================================== Utility functions for the tests ===============================================
// =====================================================================================================================
// Utility functions used in the tests
const connectControllerToServer = (socketClientObs) => {
    return socketClientObs.onEvent(server_multi_object_1.Event.CONNECT).pipe(operators_1.tap(() => console.log('Controller connected')), operators_1.tap(() => socketClientObs.send(server_multi_object_1.Event.BIND_CONTROLLER)), operators_3.switchMap(() => socketClientObs.onEvent(server_multi_object_1.Event.MOBILE_OBJECT)));
};
const connectMonitorToServer = (socketClientObs) => {
    return socketClientObs.onEvent(server_multi_object_1.Event.CONNECT).pipe(operators_1.tap(() => console.log('Monitor connected')), operators_1.tap(() => socketClientObs.send(server_multi_object_1.Event.BIND_MONITOR)), operators_3.switchMap(() => socketClientObs.onEvent(server_multi_object_1.Event.MOBILE_OBJECT)));
};
// =====================================================================================================================
// ===================================== END Utility functions for the tests ===========================================
// =====================================================================================================================
// TEST 1
// A Controller connects to the Server and tells the server that is a controller - the Server sends the MobileObjectId
const socketClientObsTest1 = new socket_io_observable_1.SocketObs(socketServerUrl);
const controllerConnectsToServer = (socketClientObs) => {
    return connectControllerToServer(socketClientObs);
};
const controllerConnectsToServerTest = (socketClientObs) => {
    controllerConnectsToServer(socketClientObs)
        .pipe(operators_4.take(1))
        .subscribe(mobileObjectId => {
        if (!mobileObjectId) {
            console.error('TEST 1 - mobileObjectId not received');
        }
        else {
            console.log('TEST 1 passed');
        }
        socketClientObs.close();
    });
};
controllerConnectsToServerTest(socketClientObsTest1);
// TEST 2
// A Controller connects to the Server and then listens if the MobileObject is turneOn
// Test that the MobileObject is turned off since it has not been yet turned on
const socketClientObsTest2 = new socket_io_observable_1.SocketObs(socketServerUrl);
const mobileObjectNotTurnedOn = (socketClientObs) => {
    return connectControllerToServer(socketClientObs).pipe(operators_3.switchMap(mobObjId => socketClientObs.onEvent(server_multi_object_1.Event.TURNED_ON + mobObjId)), operators_2.map(turnedOn => JSON.parse(turnedOn)));
};
const mobileObjectNotTurnedOnTest = (socketClientObs) => {
    mobileObjectNotTurnedOn(socketClientObs)
        .pipe(operators_4.take(1))
        .subscribe(turnedOn => {
        if (turnedOn) {
            console.error('TEST 2 - mobileObjectId should be turned off');
        }
        else {
            console.log('TEST 2 - passed');
        }
        socketClientObs.close();
    });
};
mobileObjectNotTurnedOnTest(socketClientObsTest2);
// TEST 3
// A Controller connects to the Server and then turns on the MobileObject
// Test that the MobileObject is turned on
const socketClientObsTest3 = new socket_io_observable_1.SocketObs(socketServerUrl);
const mobileObjectTurnedOn = (socketClientObs) => {
    return connectControllerToServer(socketClientObs).pipe(operators_3.switchMap(mobObjId => socketClientObs.onEvent(server_multi_object_1.Event.TURNED_ON + mobObjId)), operators_1.tap(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        setTimeout(() => {
            socketClientObs.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
        }, 300);
    }), operators_2.map(turnedOn => JSON.parse(turnedOn)));
};
const mobileObjectTurnedOnTest = (socketClientObs) => {
    mobileObjectTurnedOn(socketClientObs)
        .pipe(operators_5.skip(1), // skips the first message which is returned when the MobileObject is created and which contains "false"
    operators_4.take(1))
        .subscribe(turnedOn => {
        if (!turnedOn) {
            console.error('TEST 3 - mobileObjectId not turned on');
        }
        else {
            console.log('TEST 3 - passed');
        }
        socketClientObs.close();
    });
};
mobileObjectTurnedOnTest(socketClientObsTest3);
// TEST 4
// A Controller connects to the Server and then first turns the MobileObject on and then it turns it off
// Test that the server sends to the client events when the MobileObject is turned off
const socketClientObsTest4 = new socket_io_observable_1.SocketObs(socketServerUrl);
const mobileObjectTurnedOff = (socketClientObs) => {
    return connectControllerToServer(socketClientObs).pipe(operators_3.switchMap(mobObjId => socketClientObs.onEvent(server_multi_object_1.Event.TURNED_ON + mobObjId)), operators_1.tap(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        setTimeout(() => {
            socketClientObs.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
        }, 400);
    }), operators_1.tap(() => {
        const turnOffCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_OFF };
        setTimeout(() => {
            socketClientObs.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOffCommand);
        }, 410);
    }), operators_2.map(turnedOn => JSON.parse(turnedOn)));
};
const mobileObjectTurnedOnAndOffTest = (socketClientObs) => {
    mobileObjectTurnedOff(socketClientObs)
        .pipe(operators_5.skip(2), // skips the first 2 messages: the first is returned when the MobileObject is created, the second when
    // it is turned on
    operators_4.take(1))
        .subscribe(turnedOn => {
        if (turnedOn) {
            console.error('TEST 4 - mobileObjectId should be turned off');
        }
        else {
            console.log('TEST 4 - passed');
        }
        socketClientObs.close();
    }, err => console.log('TEST 4 - Obs error', err), () => console.log('TEST 4 - Obs complete') // this function is hit since we have the 'take(1)' operator which completes the Observable
    );
};
mobileObjectTurnedOnAndOffTest(socketClientObsTest4);
// TEST 5
// A Controller connects to the Server and then turns its MobileObject on
// A second Controller connects to the Server and does nothing
// After some time the first one is turned off while the second one is turned on
// Test that, after all these things happened, the first receives a 'turnedOff' message from the Server
// while the second one receives a 'turnedOn' message from the server
const socketClientObs_1_Test5 = new socket_io_observable_1.SocketObs(socketServerUrl);
const socketClientObs_2_Test5 = new socket_io_observable_1.SocketObs(socketServerUrl);
const mobileObject_1_Test5 = (socketClientObs) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketClientObs.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 500);
    setTimeout(() => {
        const turnOffCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_OFF };
        socketClientObs.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOffCommand);
    }, 510);
    return connectControllerToServer(socketClientObs).pipe(operators_3.switchMap(mobObjId => socketClientObs.onEvent(server_multi_object_1.Event.TURNED_ON + mobObjId)), operators_2.map(turnedOn => JSON.parse(turnedOn)));
};
const mobileObject_2_Test5 = (socketClientObs) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketClientObs.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 510);
    return connectControllerToServer(socketClientObs).pipe(operators_3.switchMap(mobObjId => socketClientObs.onEvent(server_multi_object_1.Event.TURNED_ON + mobObjId)), operators_2.map(turnedOn => JSON.parse(turnedOn)));
};
const twoMobileObjectsTurnedOnAndOffTest = (socketClientObs_1, socketClientObs_2) => {
    let isMobObj_1_turnedOn;
    let isMobObj_2_turnedOn;
    mobileObject_1_Test5(socketClientObs_1)
        .subscribe(turnedOn => isMobObj_1_turnedOn = turnedOn);
    mobileObject_2_Test5(socketClientObs_2)
        .subscribe(turnedOn => isMobObj_2_turnedOn = turnedOn);
    setTimeout(() => {
        if (isMobObj_1_turnedOn) {
            console.error('TEST 5_1 - the first mobile object should be turned off');
        }
        if (!isMobObj_2_turnedOn) {
            console.error('TEST 5_2 - the second mobile object should be turned on');
        }
        if (!isMobObj_1_turnedOn && isMobObj_2_turnedOn) {
            console.log('TEST 5 passed');
        }
        socketClientObs_1.close();
        socketClientObs_2.close();
    }, 520);
};
twoMobileObjectsTurnedOnAndOffTest(socketClientObs_1_Test5, socketClientObs_2_Test5);
// TEST 7
// 2 Controllers connect to the Server and then turn their respective MobileObjects on
// The first one accelerates positively on the X axis, while the second accelerates negatively on the X axis
// A Monitor also connect to the Server
// Test that after some time the Monitor receives posite velocity for the first one and negative for the second
const socket_Controller_1_Test7 = new socket_io_observable_1.SocketObs(socketServerUrl);
const socket_Controller_2_Test7 = new socket_io_observable_1.SocketObs(socketServerUrl);
const socket_Monitor_Test7 = new socket_io_observable_1.SocketObs(socketServerUrl);
let mobObjId_1_Test7;
let mobObjId_2_Test7;
const controller_1_Test7 = (socketController) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 700);
    setTimeout(() => {
        const accelerateCommand = { action: server_multi_object_2.MobileObjectCommand.ACCELERATE_X, value: 100 };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, accelerateCommand);
    }, 710);
    connectControllerToServer(socketController).pipe(operators_1.tap(id => mobObjId_1_Test7 = id))
        .subscribe();
};
const controller_2_Test7 = (socketController) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 700);
    setTimeout(() => {
        const accelerateCommand = { action: server_multi_object_2.MobileObjectCommand.ACCELERATE_X, value: -100 };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, accelerateCommand);
    }, 710);
    connectControllerToServer(socketController).pipe(operators_1.tap(id => mobObjId_2_Test7 = id))
        .subscribe();
};
const twoMobileObjectsWithMonitorTest = (socketController_1, socketController_2, socketMonitor) => {
    let mobObj_1_Dynamics;
    let mobObj_2_Dynamics;
    controller_1_Test7(socketController_1);
    controller_2_Test7(socketController_2);
    const monitorConnection = connectMonitorToServer(socketMonitor);
    monitorConnection
        .pipe(operators_6.filter(id => id === mobObjId_1_Test7), // take the first MobileObject, i.e. the one with positive acceleration
    operators_3.switchMap(mobObjId => socketMonitor.onEvent(server_multi_object_1.Event.DYNAMICS_INFO + mobObjId)), operators_2.map(dynamics => JSON.parse(dynamics)), operators_2.map(dynamics => dynamics[0]) // take the X axis
    )
        .subscribe(dynamics => mobObj_1_Dynamics = dynamics);
    monitorConnection
        .pipe(operators_6.filter(id => id === mobObjId_2_Test7), // take the second MobileObject, i.e. the one with negative acceleration
    operators_3.switchMap(mobObjId => socketMonitor.onEvent(server_multi_object_1.Event.DYNAMICS_INFO + mobObjId)), operators_2.map(dynamics => JSON.parse(dynamics)), operators_2.map(dynamics => dynamics[0]) // take the X axis
    )
        .subscribe(dynamics => mobObj_2_Dynamics = dynamics);
    setTimeout(() => {
        if (!mobObj_1_Dynamics) {
            console.error('TEST 7_1 - the dynamics mobile object 1 should be defined');
        }
        if (!mobObj_2_Dynamics) {
            console.error('TEST 7_2 - the dynamics mobile object 2 should be defined');
        }
        if (mobObj_1_Dynamics.vel <= 0) {
            console.error('TEST 7_1 - the first mobile object should have positive velocity');
        }
        if (mobObj_2_Dynamics.vel >= 0) {
            console.error('TEST 7_2 - the first mobile object should have negative velocity');
        }
        if (mobObj_1_Dynamics.vel > 0 && mobObj_2_Dynamics.vel < 0) {
            console.log('TEST 7 passed');
        }
        socketController_1.close();
        socketController_2.close();
        socketMonitor.close();
    }, 790);
};
twoMobileObjectsWithMonitorTest(socket_Controller_1_Test7, socket_Controller_2_Test7, socket_Monitor_Test7);
// TEST 9
// One Controller connects to the Server, turns its MobileObject on, accelerates and then brakes
// Later a Monitor connects to the Server
// Test that after some time the Monitor sees that the MobileObject has stopped moving (as a result of the brake)
const socket_Controller_Test9 = new socket_io_observable_1.SocketObs(socketServerUrl);
const socket_Monitor_Test9 = new socket_io_observable_1.SocketObs(socketServerUrl);
let mobObjId_Test9;
const controller_Test9 = (socketController) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 900);
    setTimeout(() => {
        const accelerateCommand = { action: server_multi_object_2.MobileObjectCommand.ACCELERATE_X, value: 100 };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, accelerateCommand);
    }, 901);
    setTimeout(() => {
        const brakeCommand = { action: server_multi_object_2.MobileObjectCommand.BRAKE };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, brakeCommand);
    }, 950);
    connectControllerToServer(socketController).pipe(operators_1.tap(id => mobObjId_Test9 = id))
        .subscribe();
};
const mobileObjectBrakesWithMonitorTest = (socketController, socketMonitor) => {
    let mobObj_Dynamics;
    controller_Test9(socketController);
    const monitorConnection = connectMonitorToServer(socketMonitor);
    setTimeout(() => {
        monitorConnection
            .pipe(operators_6.filter(id => id === mobObjId_Test9), // take the MobileObject created for this test
        operators_3.switchMap(mobObjId => socketMonitor.onEvent(server_multi_object_1.Event.DYNAMICS_INFO + mobObjId)), operators_2.map(dynamics => JSON.parse(dynamics)), operators_2.map(dynamics => dynamics[0]) // take the X axis
        )
            .subscribe(dynamics => mobObj_Dynamics = dynamics);
    }, 10);
    let firstCheckPassed = true;
    let secondCheckPassed = true;
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 9 step 1 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel <= 0) {
            firstCheckPassed = false;
            console.error('TEST 9 - the mobile object should have positive velocity');
        }
    }, 951);
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 9 step 2 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel !== 0) {
            secondCheckPassed = false;
            console.error('TEST 9 - the mobile object should be still after some time');
        }
        if (firstCheckPassed && secondCheckPassed) {
            console.log('TEST 9 passed');
        }
        socketController.close();
        socketMonitor.close();
    }, 999);
};
mobileObjectBrakesWithMonitorTest(socket_Controller_Test9, socket_Monitor_Test9);
// TEST 10
// Like TEST 9 with the only difference that now first we connect the Monitor and then the Controller
// so the MobileObject is created after the Monitor is already connected
const socket_Controller_Test10 = new socket_io_observable_1.SocketObs(socketServerUrl);
const socket_Monitor_Test10 = new socket_io_observable_1.SocketObs(socketServerUrl);
let mobObjId_Test10;
const controller_Test10 = (socketController) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 1000);
    setTimeout(() => {
        const accelerateCommand = { action: server_multi_object_2.MobileObjectCommand.ACCELERATE_X, value: 100 };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, accelerateCommand);
    }, 1001);
    setTimeout(() => {
        const brakeCommand = { action: server_multi_object_2.MobileObjectCommand.BRAKE };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, brakeCommand);
    }, 1050);
    connectControllerToServer(socketController).pipe(operators_1.tap(id => mobObjId_Test10 = id))
        .subscribe();
};
const monitorConnectsAndThenControllerTest = (socketController, socketMonitor) => {
    let mobObj_Dynamics;
    const monitorConnection = connectMonitorToServer(socketMonitor);
    monitorConnection
        .pipe(operators_6.filter(id => id === mobObjId_Test10), // take the MobileObject created for this test
    operators_3.switchMap(mobObjId => socketMonitor.onEvent(server_multi_object_1.Event.DYNAMICS_INFO + mobObjId)), operators_2.map(dynamics => JSON.parse(dynamics)), operators_2.map(dynamics => dynamics[0]) // take the X axis
    )
        .subscribe(dynamics => mobObj_Dynamics = dynamics);
    setTimeout(() => {
        controller_Test10(socketController);
    }, 10);
    let firstCheckPassed = true;
    let secondCheckPassed = true;
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 10 step 1 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel <= 0) {
            firstCheckPassed = false;
            console.error('TEST 10 - the mobile object should have positive velocity');
        }
    }, 1051);
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 10 step 2 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel !== 0) {
            secondCheckPassed = false;
            console.error('TEST 10 - the mobile object should be still after some time');
        }
        if (firstCheckPassed && secondCheckPassed) {
            console.log('TEST 10 passed');
        }
        socketController.close();
        socketMonitor.close();
    }, 1099);
};
monitorConnectsAndThenControllerTest(socket_Controller_Test10, socket_Monitor_Test10);
// TEST 11
// One Controller connects to the Server and creates a MobileObject, then also a Monitor connects
// After some time the Controller disconnects and the Monitor gets notified that a MobileObject has been removed
// Later a Monitor connects to the Server
const socket_Controller_Test11 = new socket_io_observable_1.SocketObs(socketServerUrl);
const socket_Monitor_Test11 = new socket_io_observable_1.SocketObs(socketServerUrl);
let mobObjId_Test11;
const controller_Test11 = (socketController) => {
    setTimeout(() => {
        const turnOnCommand = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
        socketController.send(server_multi_object_1.Event.CONTROLLER_COMMAND, turnOnCommand);
    }, 1100);
    setTimeout(() => {
        socketController.close();
    }, 2000);
    connectControllerToServer(socketController).pipe(operators_1.tap(id => mobObjId_Test11 = id))
        .subscribe();
};
const controllerDisconnectsAndMonitorIsNotifiedTest = (socketController, socketMonitor) => {
    let mobObjRemovedId;
    const monitorConnection = connectMonitorToServer(socketMonitor);
    monitorConnection
        .pipe(operators_6.filter(id => id === mobObjId_Test11), // take the MobileObject created for this test
    operators_3.switchMap(_mobObjId => socketMonitor.onEvent(server_multi_object_1.Event.MOBILE_OBJECT_REMOVED + mobObjId_Test11)))
        .subscribe(mobObjId => mobObjRemovedId = mobObjId);
    // setTimeout(() => {
    controller_Test11(socketController);
    // }, 10);
    setTimeout(() => {
        if (!mobObjRemovedId) {
            console.error('TEST 11 - the mobile object should have been removed');
        }
        else if (mobObjRemovedId !== mobObjId_Test11) {
            console.error('TEST 11 - the mobile object removed is not that expected', mobObjRemovedId, mobObjId_Test11);
        }
        else {
            console.log('TEST 11 passed');
        }
        // socketController.close();
        socketMonitor.close();
    }, 2150);
};
controllerDisconnectsAndMonitorIsNotifiedTest(socket_Controller_Test11, socket_Monitor_Test11);
//# sourceMappingURL=server-multi-object.test.js.map