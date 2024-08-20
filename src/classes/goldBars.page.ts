import { type Locator, type Page } from '@playwright/test';

export enum Position {
    left = "left",
    right = "right",
};

/**
 * goldBarsPage - The main page object class.
 * @export
 * @class goldBarsPage
 */
export class goldBarsPage {
    readonly page: Page;
    bars: Array<number>;
    startingBars: Array<number>;
    suspectedFakeBar: number | void;
    readonly resetButton: Locator;
    readonly weighButton: Locator;
    readonly results: Locator;
    readonly lastResult: Locator;
    readonly barValues: Locator;
    currentResults: number;
    lastResultValue: string;
    tryCount: number;
    maxTries: number;
    lastalertText: string;

    constructor(page: Page, bars: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
        this.page = page;
        this.startingBars = bars;
        this.suspectedFakeBar = -1;
        this.bars = bars;
        this.resetButton = this.page.locator('button[id="reset"]').getByText('Reset');
        this.weighButton = this.page.locator('button[id="weigh"]');
        this.results = this.page.locator('div[class="game-info"] ol li');
        this.lastResult = this.page.locator('div[class="game-info"] ol li:last-child');
        this.barValues = this.page.locator('div.coins button');
        this.currentResults = 0;
        this.lastResultValue = "";
        this.tryCount = 0;
        this.maxTries = 10;
        this.lastalertText = "";
    }

    /**
     * getResults - Grabs all results list item locators from the page.
     * @return {*}  {Promise<Locator[]>} - Resolves to an array of locators.
     * @memberof goldBarsPage
     */
    async getResults(): Promise<Locator[]> {
        const newResult = await this.results.all();
        return newResult;
    }

    /**
     * parseResults - Grab the latest results value as text.
     * @return {*}  {Promise<string>} - Resolves to the latest results value. If no value is found, returns an empty string.
     * @memberof goldBarsPage
     */
    async parseResults(): Promise<string> {
        this.lastResultValue = (await this.lastResult.textContent()) || "";
        return this.lastResultValue;
    }

    /**
     * weighBars - Assess any current weighings, click the Weigh button, and wait for new results to populate.
     * @return {*}  {Promise<void>} - Resolves to the result of this.parseResults.
     * @memberof goldBarsPage
     */
    async weighBars(): Promise<void> {
        // Get current result count from previous weighing attempts and re-weigh the bars.
        this.currentResults = (await this.getResults())?.length || 0;
        await this.weighButton.click();

        // Give a few seconds for new results to appear. Parse them once they're present.
        for (let check = 0; check < 4; check++) {
            const newResults = (await this.getResults())?.length || 0;
            if (newResults > this.currentResults) break;
            await this.page.waitForTimeout(1000); // Limited interaction based on clicking 'Weigh' button, sleep in case value fails to update.
        }
        await this.parseResults();
    };

    /**
     * scaleItem - Acquire the locator for the area on the scale you wish to place a gold bar.
     * @param {Position} position - The side of the scale you wish to place a gold bar on, be it "left" or "right".
     * @param {number} [index=0] - The index position on the individual scale plate that you wish to place a gold bar on, starting from
     * top-left (0), increasing as you move left-to-right in each row, ending in the bottom-right corner (8). Defaults to 0.
     * @return {*}  {Locator} - Returns a Playwright-compatible locator for the position on the scale.
     * @memberof goldBarsPage
     */
    scaleItem(position: Position, index: number = 0): Locator {
        return this.page.locator(`input[data-side="${position}"][data-index="${index}"]`);
    }

    /**
     * coinButton - The gold bar buttons, as assigned by index.
     * @param {number} [index=0] - The index of the gold bar (coin) button you'd like to click.
     * @return {*}  {Locator} - Returns a locator for the gold bar (coin) button.
     * @memberof goldBarsPage
     */
    coinButton(index: number = 0): Locator {
        return this.page.locator(`button[id="coin_${index}"]`)
    }

    /**
     * compareBars - Recursively compares sets of gold bars until a suspected fake bar is identified. Will throw if the number of attempts exceeds the this.maxTries value.
     * @return {*}  {(Promise<number | void>)} - Resolves to either another instance of itself, or the last remaining gold bar index value in the set.
     * @memberof goldBarsPage
     */
    async compareBars(): Promise<number> {
        // If 1 or less bars exist within the total bars provided/remaining, return before processing further.
        if (this.bars.length <= 1) {
            this.suspectedFakeBar = this.bars.pop();
            return Number(this.suspectedFakeBar);
        }

        // Define current bars and their positions on and/or off the scale.
        const lastBar = Math.floor(this.bars.length % 2) === 0 ? null : this.bars.pop();
        const middle = Math.floor(this.bars.length / 2);
        const scales = [
            {
                position: Position.left,
                bars: this.bars.slice(0, middle)
            },
            {
                position: Position.right,
                bars: this.bars.slice(middle, this.bars.length)
            }
        ];
        
        // Reset the scales, fill each side with values (gold bars), and weigh them accordingly.
        await this.resetButton.click();
        for (const scale of scales) {
            let index = 0;
            for (const item of scale.bars) {
                await this.scaleItem(scale.position, index).fill(item.toString());
                index++;
            }
        }
        await this.weighBars();

        // If both sides are equal, the remaining bar is the fake by default.
        if (lastBar && this.lastResultValue?.includes('=')) return lastBar;

        // Otherwise, identify which side contains the suspected fake bar and grab that array.
        const newBarsIndex = this.lastResultValue?.includes('<') ? 0 : this.lastResultValue?.includes('>') ? 1 : -1;
        if (newBarsIndex < 0) throw `Invalid comparison returned: ${this.lastResultValue}`;
        this.bars = JSON.parse(this.lastResultValue?.trim().split(/>|</)[newBarsIndex]);

        // Iterate the attempt and stop if we exceed a set limit. Otherwise, continue investigating the gold bars.
        if (this.tryCount++ > this.maxTries) throw `Maximum retry count (${this.maxTries}): ${this.tryCount}`;
        return await this.compareBars();
    }

    /**
     * accuseBar - Click the button for the suspected fake gold bar and parse the alert text that appears.
     * @param {number} accuseBar - The index of the suspected fake gold bar to click. Defaults to -1, an invalid UI index.
     * @return {*}  {Promise<string>} - Resolves to the alert text that appears after clicking the gold bar's index number button.
     * @memberof goldBarsPage
     */
    async accuseBar(accuseBar: number = -1): Promise<string> {
        if (accuseBar < 0) throw `Invalid index provided: ${accuseBar}`;
        this.page.once("dialog", async (alert) => {
            this.lastalertText = alert.message();
            await alert.accept('OK');
        });
        await this.coinButton(accuseBar).click();
        return this.lastalertText;
    }

    /**
     * getRandomRealBar - Grabs a random real bar based on values that do **not** match the suspected fake gold bar value.
     * @return {*}  {Promise<number>} - Resolves to the first number returned in an array of real gold bars.
     * @memberof goldBarsPage
     */
    async getRandomRealBar(): Promise<number> {
        return this.startingBars.filter((bar: number) => bar != this.suspectedFakeBar)[0];
    }

}