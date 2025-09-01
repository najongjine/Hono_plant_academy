import { Hono } from 'hono';
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
        return c.json(result);
    }
    catch (error) {
        result.success = false;
        result.message = `error. ${error?.message ?? ""}`;
        return c.json(result);
    }
});
export default router;
