const { exec } = require("child_process");

// exec("ls", (error, stdout, stderr) => {
//     console.log("stdout: ", stdout);
// });

exec("chmod +x setup-mosquitto-dione.sh", (error, stdout, stderr) => {
    if(error) {
        console.error(`error : ${error.message}`);
        return;
    } else if(stderr) {
        console.error(`stderr: ${stderr}`);
    }

    console.log(`stdout: \n${stdout}`);
});

exec("./setup-mosquitto-dione.sh", (error, stdout, stderr) => {
    if(error) {
        console.error(`error : ${error.message}`);
        return;
    } else if(stderr) {
        console.error(`stderr: ${stderr}`);
    }

    console.log(`stdout: \n${stdout}`);
});

exec("chmod +x startOsx", { cwd: "./../rtalkDistribution" }, (error, stdout, stderr) => {
    if(error) {
        console.error(`error : ${error.message}`);
        return;
    } else if(stderr) {
        console.error(`stderr: ${stderr}`);
    }

    console.log(`stdout: \n${stdout}`);
});

exec("./startOsx", { cwd: "./../rtalkDistribution" }, (error, stdout, stderr) => {
    if(error) {
        console.error(`error : ${error.message}`);
        return;
    } else if(stderr) {
        console.error(`stderr: ${stderr}`);
    }

    console.log(`stdout: \n${stdout}`);
});