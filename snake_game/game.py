import pygame
import sys
from .settings import *
from .snake import Snake, BotSnake
from .food import Food

class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Python Snake Game - Extreme Edition")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("monospace", 16)
        self.large_font = pygame.font.SysFont("monospace", 32)
        
        self.state = MENU
        self.running = True
        self.reset_game()

    def reset_game(self):
        self.player_snake = Snake(GREEN, ((SCREEN_WIDTH // 2), (SCREEN_HEIGHT // 2)))
        self.bots = [
            BotSnake(PURPLE, (100, 100)),
            BotSnake(CYAN, (SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100))
        ]
        self.food = Food()

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                pygame.quit()
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                if self.state == MENU:
                    if event.key == pygame.K_RETURN:
                        self.state = PLAYING
                elif self.state == GAME_OVER:
                    if event.key == pygame.K_r:
                        self.reset_game()
                        self.state = PLAYING
                    elif event.key == pygame.K_q:
                        self.running = False
                elif self.state == PLAYING:
                    if event.key == pygame.K_UP:
                        self.player_snake.turn(UP)
                    elif event.key == pygame.K_DOWN:
                        self.player_snake.turn(DOWN)
                    elif event.key == pygame.K_LEFT:
                        self.player_snake.turn(LEFT)
                    elif event.key == pygame.K_RIGHT:
                        self.player_snake.turn(RIGHT)

    def update(self):
        if self.state != PLAYING:
            return

        # Move Player
        game_over = self.player_snake.move()
        if game_over:
            self.state = GAME_OVER
            return

        # Move Bots
        for bot in self.bots:
            bot.auto_move(self.food.position)
            bot.move()
            
            # Check collision with player
            if self.player_snake.get_head_position() in bot.positions:
                self.state = GAME_OVER
                return
            
            # Check if bot hits player
            if bot.get_head_position() in self.player_snake.positions:
                self.state = GAME_OVER
                return

        # Food Collision
        # Player eats food
        if self.player_snake.get_head_position() == self.food.position:
            self.player_snake.grow()
            self.food.randomize_position()
            
        # Bots eat food (optional: maybe they just grow or steal it?)
        for bot in self.bots:
            if bot.get_head_position() == self.food.position:
                bot.grow()
                self.food.randomize_position()

    def draw_text_centered(self, text, font, color, y_offset=0):
        surface = font.render(text, True, color)
        rect = surface.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + y_offset))
        self.screen.blit(surface, rect)

    def draw(self):
        self.screen.fill(BLACK)
        
        if self.state == MENU:
            self.draw_text_centered("SNAKE GAME EXTREME", self.large_font, GREEN, -50)
            self.draw_text_centered("Press ENTER to Start", self.font, WHITE, 50)
            
        elif self.state == PLAYING:
            self.player_snake.draw(self.screen)
            for bot in self.bots:
                bot.draw(self.screen)
            self.food.draw(self.screen)
            
            text = self.font.render(f"Score: {self.player_snake.score}", 1, WHITE)
            self.screen.blit(text, (5, 10))
            
        elif self.state == GAME_OVER:
            self.draw_text_centered("GAME OVER", self.large_font, RED, -50)
            self.draw_text_centered(f"Final Score: {self.player_snake.score}", self.font, WHITE, 0)
            self.draw_text_centered("Press R to Restart or Q to Quit", self.font, WHITE, 50)
        
        pygame.display.update()

    def run(self):
        while self.running:
            self.handle_input()
            self.update()
            self.draw()
            self.clock.tick(FPS)
