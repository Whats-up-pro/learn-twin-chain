"""vnpay_python URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin

import vnpay_python.views

urlpatterns = [
    url(r'^$', vnpay_python.views.index, name='index'),
    url(r'^payment$', vnpay_python.views.payment, name='payment'),
    url(r'^payment_ipn$', vnpay_python.views.payment_ipn, name='payment_ipn'),
    url(r'^payment_return$', vnpay_python.views.payment_return, name='payment_return'),
    url(r'^query$', vnpay_python.views.query, name='query'),
    url(r'^refund$', vnpay_python.views.refund, name='refund'),
    url(r'^admin/', admin.site.urls),
]
