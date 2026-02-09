from django.urls import path
from .views import CreateSubscriptionCheckout

urlpatterns = [
    path("checkout/", CreateSubscriptionCheckout.as_view()),
]
