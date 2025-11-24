from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import HighScore
import json

def index(request):
    return render(request, 'game/index.html')

@csrf_exempt
def save_score(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            score = data.get('score')
            HighScore.objects.create(score=score)
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid method'})

def get_top_scores(request):
    scores = HighScore.objects.order_by('-score')[:5]
    data = [{'score': s.score, 'date': s.date.strftime('%Y-%m-%d %H:%M')} for s in scores]
    return JsonResponse({'scores': data})
