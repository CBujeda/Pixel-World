const express = require('express');

module.exports = function(app, userModel, settingsModel) {
    const router = express.Router();

    // Middleware pre-chequeo (Admin simple route protector)
    router.use((req, res, next) => {
        if (!req.session || !req.session.user || req.session.user.rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
        }
        next();
    });

    /**
     * Endpoint para bloquear / habilitar el registro
     * @route POST /admin/toggle-registration
     */
    router.post('/toggle-registration', async (req, res) => {
        try {
            const { enabled } = req.body;
            await settingsModel.updateSetting('registration_enabled', enabled ? '1' : '0');
            res.json({ success: true, message: `Registro ${enabled ? 'habilitado' : 'deshabilitado'}` });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    /**
     * Endpoint para bloquear a otros usuarios específicos
     * @route POST /admin/ban-user
     */
    router.post('/ban-user', async (req, res) => {
        try {
            const { userId, isBanned } = req.body;
            // Evitar banearse a uno mismo
            if (parseInt(userId) === req.session.user.id) {
                return res.status(400).json({ error: 'No puedes banearte a ti mismo' });
            }
            const success = await userModel.banUser(userId, isBanned);
            if (success) {
                res.json({ success: true, message: `Usuario ${isBanned ? 'baneado' : 'desbaneado'}` });
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error del servidor al intentar banear' });
        }
    });

    app.use('/admin', router);
};
