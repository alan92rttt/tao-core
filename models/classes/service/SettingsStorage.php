<?php
/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

namespace oat\tao\model\service;

use common_Exception;
use common_persistence_KeyValuePersistence;
use oat\oatbox\service\ConfigurableService;
use oat\tao\model\settings\SettingsStorageInterface;

/**
 * Persistence for settings
 *
 * @author Martijn Swinkels <m.swinkels@taotesting.com>
 */
class SettingsStorage extends ConfigurableService implements SettingsStorageInterface
{

    /**
     * @var common_persistence_KeyValuePersistence
     */
    private $persistence;

    /**
     * @inheritdoc
     */
    public function set($settingId, $data)
    {
        try {
            return $this->getPersistence()->set($settingId, $data);
        } catch (common_Exception $e) {
            return false;
        }
    }

    /**
     * @inheritdoc
     */
    public function get($settingId)
    {
        return $this->getPersistence()->get($settingId);
    }

    /**
     * @inheritdoc
     */
    public function exists($settingId)
    {
        return $this->getPersistence()->exists($settingId);
    }

    /**
     * @inheritdoc
     */
    public function del($settingId)
    {
        return $this->getPersistence()->del($settingId);
    }

    /**
     * Get the persistence
     */
    private function getPersistence()
    {
        if ($this->persistence === null) {
            $this->persistence = common_persistence_KeyValuePersistence::getPersistence(
                $this->getOption(self::OPTION_PERSISTENCE)
            );
        }
        return $this->persistence;
    }
}
