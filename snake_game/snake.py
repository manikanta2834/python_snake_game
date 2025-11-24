import pygame
from .settings import *
import random

class Snake:
    def __init__(self, color=GREEN, start_pos=None):
        self.start_pos = start_pos if start_pos else ((SCREEN_WIDTH // 2), (SCREEN_HEIGHT // 2))
        self.color = color
        self.reset()

    def reset(self):
        self.length = 1
        self.positions = [self.start_pos]
        self.direction = random.choice([UP, DOWN, LEFT, RIGHT])
        self.score = 0
        self.alive = True

    def get_head_position(self):
        return self.positions[0]

    def turn(self, point):
        if self.length > 1 and (point[0] * -1, point[1] * -1) == self.direction:
            return
        else:
            self.direction = point

    def move(self):
        if not self.alive:
            return False
            
        cur = self.get_head_position()
        x, y = self.direction
        new = (((cur[0] + (x * GRID_SIZE)) % SCREEN_WIDTH), (cur[1] + (y * GRID_SIZE)) % SCREEN_HEIGHT)
        
        # Check for self collision
        if len(self.positions) > 2 and new in self.positions[2:]:
            self.alive = False
            return True # Collision signal
            
        self.positions.insert(0, new)
        if len(self.positions) > self.length:
            self.positions.pop()
        return False

    def grow(self):
        self.length += 1
        self.score += 1

    def draw(self, surface):
        for p in self.positions:
            r = pygame.Rect((p[0], p[1]), (GRID_SIZE, GRID_SIZE))
            pygame.draw.rect(surface, self.color, r)
            pygame.draw.rect(surface, WHITE, r, 1) # Border

class BotSnake(Snake):
    def __init__(self, color=PURPLE, start_pos=None):
        super().__init__(color, start_pos)
        self.move_timer = 0

    def auto_move(self, food_pos):
        # Simple AI: Move towards food
        head = self.get_head_position()
        
        # Determine possible moves
        possible_moves = []
        for d in [UP, DOWN, LEFT, RIGHT]:
            # Don't reverse
            if self.length > 1 and (d[0] * -1, d[1] * -1) == self.direction:
                continue
            possible_moves.append(d)
            
        # Pick best move towards food
        best_move = self.direction
        min_dist = float('inf')
        
        # Add some randomness to make them less perfect
        if random.random() < 0.2:
            if possible_moves:
                self.direction = random.choice(possible_moves)
            return

        for move in possible_moves:
            # Predict new position
            new_x = (head[0] + move[0] * GRID_SIZE) % SCREEN_WIDTH
            new_y = (head[1] + move[1] * GRID_SIZE) % SCREEN_HEIGHT
            
            dist = abs(new_x - food_pos[0]) + abs(new_y - food_pos[1])
            
            if dist < min_dist:
                min_dist = dist
                best_move = move
                
        self.direction = best_move
