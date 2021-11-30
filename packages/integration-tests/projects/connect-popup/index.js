const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { Controller } = require('../../websocket-client');

const defaults = {
    // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
    mnemonic:
        'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    pin: '',
    passphrase_protection: false,
    label: 'My Trevor',
    needs_backup: false,
};

console.log(process.env);

const url = process.env.URL || 'http://localhost:8082/';
const HEADLESS = process.env.HEADLESS === 'true';
const SCREENSHOTS_DIR = './packages/connect-explorer/screenshots';
const CI_JOB_URL = process.env.CI_JOB_URL || '.';

// todo:
// verifyMessage

const setups = [
    {
        device: {
            // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        },
        fixtures: [
            {
                method: 'getPublicKey',
                view: 'export-xpub',
                views: [
                    { name: 'export-xpub', confirm: ['host'] }
                ]
            },
            {
                method: 'getPublicKey-multiple',
                views: [
                    { name: 'export-xpub', confirm: ['host'] },
                ],
            },
            {
                method: 'getAddress',
                views: [
                    { name: 'export-address', confirm: ['host'] },
                    { name: 'check-address', confirm: ['device'] }
                ],
            },
            // todo: forbidden key path at the moment
            {
                method: 'getAddress-multiple',
                views: [
                    { name: 'export-address', confirm: ['host'] },
                ],
            },
            {
                method: 'getAccountInfo',
                views: [
                    { name: 'export-account-info', confirm: ['host'] },
                ],
            },
            // {
            //     method: 'composeTransaction',
            //     views: [
            //         {
            //             name: 'select-account',
            //             confirm: [
            //                 '#container > div > div.wrapper > div.select-account-list.segwit > button:nth-child(1)',
            //             ]
            //         },
            //         {
            //             name: 'select-fee-list',
            //             confirm: ['.send-button', 'device', 'device']
            //         }
            //     ],
            // },
            // {
            //     method: 'signMessage',
            //     views: [
            //         {
            //             name: 'info-panel', // does not have a special screen
            //             confirm: ['device', 'device']
            //         },
            //     ],
            // },
            // todo: wipe ends up on "connect device to continue" although device is connected
            // note: probably only with bridge 2.0.31
            // note: hmm not only :(
            // {
            //     method: 'wipeDevice',
            //     views: [
            //         {
            //             name: 'device-management',
            //             confirm: ['host', 'device']
            //         },
            //     ],
            // },
        ]
    },
    // {
    //     device: {
    //         wiped: true,
    //     },
    //     fixtures: [
    //         {
    //             method: 'resetDevice',
    //             views: [
    //                 {
    //                     name: 'device-management',
    //                     confirm: ['host', 'device']
    //                 },
    //             ],
    //         },
    //         {
    //             method: 'recoverDevice',
    //             views: [
    //                 {
    //                     name: 'device-management',
    //                     confirm: ['host', 'device']
    //                 },
    //             ],
    //         },


    //     ]
    // }
]


const wait = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

const log = (...val) => {
    console.log(`[===]`, ...val);
}

(async () => {
    try {
        if (fs.existsSync(SCREENSHOTS_DIR)) {
            fs.rmdirSync(SCREENSHOTS_DIR, { recursive: true });
            fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        } else {
            fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        }

        const controller = new Controller({ url: 'ws://localhost:9001/' });

        let retries = 0;
        let connected = false;
        while (!connected && retries < 60) {
            try {
                await controller.connect();
                connected = true;
            } catch (err) {
                console.log('waiting for trezor-user-env...');
            }
            await wait(1000);
            retries++;
        }

        const browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
            ]
        });

        // todo: another case of buggy behavior in bridge 3.0.31.
        // await controller.send({ type: 'bridge-start', version: '2.0.27' });

        for (setup of setups) {
            await wait(500)
            await controller.send({
                type: 'emulator-stop',
            });
            await wait(500)
            await controller.send({
                type: 'emulator-start',
                wipe: true,
            });
            await wait(500)
            await controller.send({
                type: 'emulator-setup',
                ...setup.device,
            });
            await wait(500)
            await controller.send({ type: 'emulator-allow-unsafe-paths' });
            await wait(500)

            for (f of setup.fixtures) {

                await controller.send({ type: 'bridge-stop' });
                await wait(1000)
                await controller.send({ type: 'bridge-start', version: '2.0.27' });
                await wait(1000)


                log(f.method, "start");

                const screenshotsPath = `${SCREENSHOTS_DIR}/${f.method}`;

                if (!fs.existsSync(screenshotsPath)) {
                    fs.mkdirSync(screenshotsPath);
                }

                const explorer = await browser.newPage();
                const popupPromise = new Promise(x => explorer.once('popup', x));

                await explorer.goto(`${url}#/method/${f.method}`);

                // screenshot request
                log(f.method, "screenshot trezor-connect call params");
                await explorer.waitForTimeout(2000);
                await explorer.screenshot({ path: `${screenshotsPath}/1-request.png`, fullPage: true });

                log(f.method, "submitting in connect explorer");
                await explorer.waitForSelector("button[data-test='@submit-button']", { visible: true });
                await explorer.click("button[data-test='@submit-button']");

                log(f.method, "waiting for popup promise");
                const popup = await popupPromise;
                log(f.method, "popup promise resolved");

                // can't really connect device here, experiencing unexpected popup closing
                // await popup.screenshot({ path: `${screenshotsPath}/2-connect-device.png`, fullPage: true });
                // await popup.waitForSelector(".connect", { visible: true, timeout: 30000 });

                try {
                    log(f.method, "waiting for confirm permissions button");
                    await popup.waitForTimeout(1000);
                    await popup.waitForSelector("button.confirm", { visible: true, timeout: 30000 });
                    await popup.screenshot({ path: `${screenshotsPath}/2-permissions.png`, fullPage: true });
                    await popup.waitForTimeout(1000);

                    await popup.click("button.confirm");
                } catch (err) {
                    log(f.method, "permissions button not found");
                    await popup.screenshot({ path: `${screenshotsPath}/2-err-permissions-not-found.png`, fullPage: true });
                }

                let viewIndex = 0;
                for (v of f.views) {

                    log(f.method, v.name, "expecting view");

                    await popup.waitForSelector(`.${v.name}`, { visible: true });

                    if (!v.confirm) {
                        continue;
                    }
                    let confirmIndex = 0;
                    for (confirm of v.confirm) {

                        await popup.waitForTimeout(2000);

                        await popup.screenshot({ path: `${screenshotsPath}/3-${viewIndex + 1}-${confirmIndex + 1}-${v.name}.png`, fullPage: true });

                        if (confirm === 'device' && f.method === 'recoverDevice') {
                            await controller.send({ type: 'emulator-press-yes' });
                            await controller.send({ type: 'select-num-of-words', num: 12 });

                        }
                        else if (confirm === 'host') {
                            log(f.method, v.name, "user interaction on host");
                            await popup.click("button.confirm");
                        } else if (confirm === 'device') {
                            log(f.method, v.name, "user interaction on device");
                            await controller.send({ type: 'emulator-press-yes' });
                        } else {
                            await popup.click(confirm);
                        }
                        confirmIndex++;
                    }
                    viewIndex++;
                    log(f.method, v.name, "view finished");
                }

                log(f.method, "all views finished");

                await explorer.waitForTimeout(2000);

                // screenshot response
                log(f.method, "screenshotting response");

                await explorer.screenshot({ path: `${screenshotsPath}/4-response.png`, fullPage: true });
                await explorer.waitForTimeout(2000);
                log(f.method, "method finished");

            }
        }

        log("closing browser");

        await browser.close();

        buildOverview();

        process.exit(0);
    } catch (err) {
        console.log('err', err);
        process.exit(1);
    }

})();

const buildOverview = () => {
    if (fs.existsSync('connect-popup-overview.html')) {
        fs.rmSync('connect-popup-overview.html');
    }

    let html = '';
    const methods = fs.readdirSync(SCREENSHOTS_DIR);
    methods.forEach(method => {
        const methodPath = path.join(SCREENSHOTS_DIR, method);
        const screenshots = fs.readdirSync(methodPath);
        html+= `<div><h1>${method}</h1></div>`;
        screenshots.forEach(screenshot => {
            const screenshotPath = `${CI_JOB_URL}/${methodPath}/${screenshot}`;
            html += `
                <div>
                <img src="${screenshotPath.replace('/packages/connect-explorer', '/artifacts/raw/packages/connect-explorer')}" />
                </div>
            `;
        })
    });

    // https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/1843753200 /artifacts/raw /packages/connect-explorer/screenshots/composeTransaction/1-request.png
    // https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/1843753200                /packages/connect-explorer/screenshots/composeTransaction/1-request.png
    
    fs.appendFileSync('connect-popup-overview.html', `
        <html>
            <head>
                <title>Connect popup</title>
            </head>
            <body>
            ${html}
            </body>
        </html>
    `);

    // src={`${data.jobUrl}${screenshot.path.replace(
    //     "trezor-suite",
    //     "artifacts/raw"
    //   )}`}

}

// todo: special cases
// no bridge
// outdated bridge
// firmware update required
// firmware outdated