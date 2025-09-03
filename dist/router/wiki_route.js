import { Hono } from 'hono';
import { sql } from "../db.js";
const router = new Hono();
router.get('/', async (c) => {
    let result = {
        success: true,
        data: null,
        code: "",
        message: ``,
    };
    try {
        const q = String(c.req.query("q") ?? "");
        let data = await sql `
        SELECT 
        *
        FROM t_plants
        `;
        result.data = data;
        return c.json(result);
    }
    catch (error) {
        result.success = false;
        result.message = `error. ${error?.message ?? ""}`;
        return c.json(result);
    }
});
router.get('/get_a_wiki', async (c) => {
    let result = {
        success: true,
        data: null,
        code: "",
        message: ``,
    };
    try {
        const wiki_id = Number(c.req.query("wiki_id") ?? 0);
        let data = await sql `
        SELECT 
        *
        FROM t_plants
        WHERE id = ${wiki_id}
        `;
        try {
            data = data[0];
        }
        catch (error) {
            data = null;
        }
        result.data = data;
        return c.json(result);
    }
    catch (error) {
        result.success = false;
        result.message = `error. ${error?.message ?? ""}`;
        return c.json(result);
    }
});
export default router;
