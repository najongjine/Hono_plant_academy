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
export default router;
