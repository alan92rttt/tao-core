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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */

namespace oat\tao\test\unit\model\security\xsrf;

use oat\generis\test\TestCase;
use oat\tao\model\security\xsrf\Token;
use oat\tao\model\security\xsrf\TokenService;
use oat\tao\model\security\xsrf\TokenStore;
use oat\oatbox\service\exception\InvalidService;
use Prophecy\Argument;

/**
 * Unit Test of oat\tao\model\security\TokenGenerator
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
class TokenServiceTest extends TestCase
{
    public function testInstantiateNoStore()
    {
        $this->expectException(InvalidService::class);
        $service = new TokenService();
        $service->checkToken('unusedString');
    }

    public function testInstantiateBadStore()
    {
        $this->expectException(InvalidService::class);
        $service = new TokenService([
            'store' =>  []
        ]);
        $service->checkToken('unusedString');
    }

    public function testCreateToken()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store
        ]);

        $this->assertEquals(0, count($store->getTokens()), 'The store is empty');

        /** @var Token $token */
        $token = $service->createToken();
        $tokenValue = $token->getValue();
        $this->assertEquals(40, strlen($tokenValue), 'The token has the expected length');
        $this->assertRegExp('/^[0-9a-f]{40}$/', $tokenValue, 'The token is correctly formatted');
        $this->assertEquals($store->getTokens()[0]->getValue(), $tokenValue, 'The store contains the correct token');

        $this->assertCount(1, $store->getTokens(), 'The store contains now one token');

        /** @var Token $token2 */
        $token2 = $service->createToken();
        $token2Value = $token2->getValue();

        $this->assertEquals(40, strlen($token2Value), 'The token has the expected length');
        $this->assertRegExp('/^[0-9a-f]{40}$/', $token2Value, 'The token is correctly formatted');
        $this->assertEquals($store->getTokens()[1]->getValue(), $token2Value, 'The store contains the correct token');

        $this->assertCount(2, $store->getTokens(), 'The store contains now two tokens');

        $this->assertNotEquals($tokenValue, $token2Value, 'The tokens are differents');
    }

    public function testGenerateTokenPool()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store,
            TokenService::POOL_SIZE_OPT => 15
        ]);

        $this->assertCount(0, $store->getTokens(), 'The store is empty');

        $tokenPool = $service->generateTokenPool();
        $this->assertCount(15, $tokenPool, 'The token pool has the expected size');

        $tokens = $store->getTokens();
        $this->assertCount(15, $tokens, 'The token pool contains the expected amount of tokens');

        /** @var Token $firstToken */
        $firstToken  = $tokens[0];

        /** @var Token $secondToken */
        $secondToken = $tokens[1];

        $this->assertInstanceOf(Token::class, $firstToken, 'The first token is a Token object');
        $this->assertInstanceOf(Token::class, $secondToken, 'The second token is a Token object');

        $this->assertNotNull($firstToken->getCreatedAt(), 'The first token contains a timestamp');
        $this->assertNotNull($firstToken->getValue(), 'The first token contains a token value');

        $this->assertNotNull($secondToken->getCreatedAt(), 'The second token contains a timestamp');
        $this->assertNotNull($secondToken->getValue(), 'The second token contains a token value');


        $this->assertNotSame(
            $firstToken->getValue(),
            $secondToken->getValue(),
            'The first and second token are different'
        );

        $this->assertTrue($service->validateToken($firstToken->getValue()), 'The first token is valid');
        $this->assertTrue($service->validateToken($secondToken), 'The second token is passed as an object, and is valid');

        $this->assertCount(13, $store->getTokens(), '2 tokens were validated, and revoked. The store contains 13 tokens');
    }

    public function testPoolSize()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store,
            'poolSize' => 4
        ]);

        $this->assertCount(0, $store->getTokens(), 'The store is empty');

        $service->createToken();
        $this->assertCount(1, $store->getTokens(), 'The store contains now one token');

        $service->createToken();
        $this->assertCount(2, $store->getTokens(), 'The store contains now two tokens');

        $service->createToken();
        $this->assertCount(3, $store->getTokens(), 'The store contains now three tokens');

        $service->createToken();
        $this->assertCount(4, $store->getTokens(), 'The store contains now four tokens');

        $service->createToken();
        $this->assertCount(4, $store->getTokens(), 'The store remains at four tokens, the max pool size');

        $service->createToken();
        $this->assertCount(4, $store->getTokens(), 'The store remains at four tokens, the max pool size');
    }

    public function testRevokeToken()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store
        ]);

        $this->assertCount(0, $store->getTokens(), 'The store is empty');

        /** @var Token $token */
        $token = $service->createToken();

        $this->assertCount(1, $store->getTokens(), 'The store contains now one token');
        $this->assertEquals($store->getTokens()[0]->getValue(), $token->getValue(), 'The store contains the correct token');

        $this->assertFalse($service->revokeToken('not a token'), 'If the token doesn\'t exist it is not revoked');
        $this->assertCount(1, $store->getTokens(), 'The store still contains one token');

        $this->assertTrue($service->revokeToken($token->getValue()), 'The token has been revoked');
        $this->assertCount(0, $store->getTokens(), 'The store doesn\'t contain the token anymore');

        /** @var Token $token */
        $token = $service->createToken();

        $this->assertTrue($service->revokeToken($token), 'Token object can be used to revoke a token');
        $this->assertCount(0, $store->getTokens(), 'Token was revoked, and store is empty');
    }

    public function testCheckToken()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store
        ]);

        $this->assertCount(0, $store->getTokens(), 'The store is empty');

        $token1 = $service->createToken();
        $token2 = $service->createToken();
        $this->assertCount(2, $store->getTokens(), 'The store contains the created tokens');

        $this->assertFalse($service->checkToken('wooch'), 'This token is not a token so it cannot be valid');
        $this->assertTrue($service->checkToken($token1->getValue()), 'This token is valid');
        $this->assertTrue($service->checkToken($token1->getValue()), 'This token is still valid');
        $this->assertTrue($service->checkToken($token2->getValue()), 'This second token is also valid');

        $this->assertTrue($service->revokeToken($token1->getValue()), 'The token has been revoked');

        $this->assertFalse($service->checkToken($token1->getValue()), 'This token has been revoked');
        $this->assertTrue($service->checkToken($token2->getValue()), 'This second token is still valid');
    }

    public function testInvalidateTimeLimit()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store,
            'timeLimit' => 1
        ]);

        $this->assertCount(0, $store->getTokens(), 'The store is empty');

        /** @var Token $token1 */
        $token1 = $service->createToken();

        $this->assertCount(1, $store->getTokens(), 'The store contains now one token');
        $this->assertTrue($service->checkToken($token1->getValue()), 'This first token is valid');

        sleep(1);

        $token2 = $service->createToken();
        $this->assertCount(1, $store->getTokens(), 'The store contains only one token, the 1st has been invalidated');
        $this->assertFalse($service->checkToken($token1->getValue()), 'This token has been revoked');

        sleep(1);

        $this->assertFalse($service->checkToken($token2->getValue()), 'This token is not valid anymore');
    }

    /**
     * @throws InvalidService
     * @throws \common_Exception
     */
    public function testTimeLimit()
    {
        $store = $this->getStoreMock();
        $service = new TokenService([
            'store' =>  $store,
            'timeLimit' => 2
        ]);

        $this->assertCount(0, $store->getTokens(), 'The store is empty');

        /** @var Token $token1 */
        $token1 = $service->createToken();

        $this->assertCount(1, $store->getTokens(), 'The store contains now one token');
        $this->assertTrue($service->checkToken($token1->getValue()), 'This first token is valid');

        sleep(1);

        /** @var Token $token2 */
        $token2 = $service->createToken();
        $this->assertCount(2, $store->getTokens(), 'The store contains the two tokens');
        $this->assertTrue($service->checkToken($token1->getValue()), 'This first token is valid');
        $this->assertTrue($service->checkToken($token2->getValue()), 'This second token is also valid');

        sleep(1);

        $this->assertFalse($service->checkToken($token1->getValue()), 'This first token is not valid anymore');
        $this->assertTrue($service->checkToken($token2->getValue()), 'This second token is still valid');

        sleep(1);

        $this->assertFalse($service->checkToken($token1->getValue()), 'This first token is not valid');
        $this->assertFalse($service->checkToken($token2->getValue()), 'This second token is not valid');
    }

    protected function getStoreMock()
    {
        /** @var TokenStore $storeMock */
        $storeMock = $this->prophesize(TokenStore::class);
        $storeMock->getTokens()->willReturn([]);
        $storeMock->setTokens(Argument::any())->will(function ($args) use ($storeMock){
            $storeMock->getTokens()->willReturn($args[0]);
        });
        return $storeMock->reveal();
    }
}
